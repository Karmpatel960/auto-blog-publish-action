const fs = require("fs");
const path = require("path");
const axios = require('axios');
const { exec } = require('@actions/exec');
const openai = require('openai');
require('dotenv').config();

const getGitPushNumber = async () => {
  let gitPushNumber;
  try {
    let commitMessage = '';
    await exec('git', ['log', '--format=%B', '-n', '1'], {
      listeners: {
        stdout: (data) => {
          commitMessage += data.toString();
        },
      },
    });

    console.log('Commit Message:', commitMessage.trim());

    const match = commitMessage.match(/Issue #(\d+)/i);
    gitPushNumber = match ? match[1] : 1;
    console.log('Commit/Issue Number:', gitPushNumber);
  } catch (error) {
    console.error('Error getting Git push number:', error.message);
  }
  return gitPushNumber;
};

const getGitProjectName = async () => {
  let gitProjectPath;
  try {
    await exec('git', ['rev-parse', '--show-toplevel'], {
      listeners: {
        stdout: (data) => {
          gitProjectPath = data.toString().trim();
        },
      },
    });

    const pathParts = gitProjectPath.split('/');
    const repoName = pathParts[pathParts.length - 1];

    return repoName;
  } catch (error) {
    console.error('Error getting Git project name:', error.message);
    return null;
  }
};

const getGitCommitDetails = async () => {
  try {
    const commitSha = process.env.GITHUB_SHA;
    const apiUrl = `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/commits/${commitSha}`;
    
    const response = await axios.get(apiUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.REPO_TOKEN}`,
      },
    });

    const commitDetails = {
      number: response.data.sha.substring(0, 7),
      author: response.data.commit.author.name,
      link: response.data.html_url,
    };

    console.log('Commit Details:', commitDetails);

    return commitDetails;
  } catch (error) {
    console.error('Error fetching commit details:', error.message);
    return null;
  }
};

const getGitDiffSummary = async () => {
  const commitHash = process.env.GITHUB_SHA;

  try {
    const patchFileName = 'changes.patch';
    const gitPatchCommand = `/usr/bin/git format-patch -1 ${commitHash} --stdout > ${patchFileName}`;
await exec(gitPatchCommand, { shell: '/bin/bash', maxBuffer: Infinity });


    const patchFilePath = path.join(process.cwd(), patchFileName);
    const patchContent = fs.readFileSync(patchFilePath, 'utf-8');

    console.log('Git Patch Content:', patchContent);

    const openaiApiKey = process.env.OPENAI_API_KEY;
    const openaiEndpoint = 'https://api.openai.com/v1/chat/completions';

    const response = await openai.ChatCompletion.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: `Summarize the following Git diff:\n${patchContent}` },
      ],
    });

    if (response && response.choices && response.choices.length > 0) {
      const summary = response.choices[0].message.content.trim();
      console.log('Summary:', summary);
      return summary;
    } else {
      console.error('Error retrieving summary from ChatGPT.');
      return null;
    }
  } catch (error) {
    console.error('Error getting Git diff summary:', error.message);
    return null;
  }
};


const generateBlogContent = async () => {
  try {
    const gitPushNumber = await getGitPushNumber();
    const commitDetails = await getGitCommitDetails();
    const changesSummary = await getGitDiffSummary();
    const codeChanges = 'Code changes';
    
    // Fetch contributors' profile photos from GitHub
    const contributorsPhotos = await getContributorsPhotos();
    
    return `
    #### Git Push Number: ${gitPushNumber}
    #### Commit Number: [${commitDetails.number}](${commitDetails.link})
  
      ## Changes Summary
      ${changesSummary}
  
      ## Code Changes
      \`\`\`
      ${codeChanges}
      \`\`\`
  
      ## Contributors
      ${contributorsPhotos.map(contributor => `
        [![${contributor.login}](${contributor.avatar_url}&s=50)](${contributor.html_url}) - ${contributor.login}
      `).join('\n')}
    `;
  } catch (error) {
    console.error('Error generating blog content:', error.message);
    return 'N/A';
  }
};

const getContributorsPhotos = async () => {
  const contributors = await getContributorsList();
  const contributorsWithPhotos = [];

  for (const contributor of contributors) {
    const response = await axios.get(contributor.url, {
      headers: {
        'Authorization': `Bearer ${process.env.REPO_TOKEN}`,
      },
    });

    if (response.data && response.data.avatar_url) {
      contributorsWithPhotos.push({
        login: contributor.login,
        avatar_url: response.data.avatar_url,
        html_url: contributor.html_url,
      });
    }
  }

  return contributorsWithPhotos;
};

const getContributorsList = async () => {
  const apiUrl = `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/contributors`;
  
  const response = await axios.get(apiUrl, {
    headers: {
      'Authorization': `Bearer ${process.env.REPO_TOKEN}`,
    },
  });

  return response.data;
};




const publishBlogPost = async () => {
  const hashnodeApiKey = process.env.HASHNODE_API_KEY;
  const hashnodeBlogId = process.env.HASHNODE_BLOG_ID;
  const apiUrl = 'https://gql.hashnode.com';

  const query = `
    mutation PublishPost($input: PublishPostInput!) {
      publishPost(input: $input) {
        post {
          id
          title
          slug
          publishedAt
        }
      }
    }
  `;

  if (!hashnodeApiKey) {
    console.error('Error: HASHNODE_API_KEY is missing or empty.');
    return;
  }

  const variables = {
    input: {
      title: `Project - ${await getGitProjectName()} Summary - Issue #${await getGitPushNumber()}`,
      subtitle: 'Summary of changes and code changes for the latest push to the Github project.',
      publicationId: hashnodeBlogId,
      contentMarkdown: await generateBlogContent(),
      publishedAt: new Date().toISOString(),
      tags: [
        {
          slug: "issueblog",
          name: "Issue Blog",
        },
      ],
    },
  };

  try {
    const response = await axios.post(
      apiUrl,
      {
        query,
        variables,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${hashnodeApiKey}`,
        },
      }
    );

    if (!response) {
      console.error('Error: No response received.');
      return;
    }

    if (response.data && response.data.errors) {
      console.error('API Response:', response.data);
      console.error('Error publishing blog post:', response.data.errors);
    } else if (response.data && response.data.data && response.data.data.publishPost && response.data.data.publishPost.post) {
      const publishedPost = response.data.data.publishPost.post;
      console.log('Blog post published successfully:', publishedPost.title);
    } else {
      console.error('Unexpected API response:', response.data);
    }
  } catch (error) {
    console.error('Error publishing blog post:', error.message);
  }
};



const main = async () => {
  await publishBlogPost();
};

main();
