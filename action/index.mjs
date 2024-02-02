import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';
import OpenAI from "openai";
import { exec } from "@actions/exec";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
  const repoToken = process.env.REPO_TOKEN;
  const commitHash = process.env.GITHUB_SHA;

  try {
    const repoInfoUrl = `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}`;
    const repoInfoResponse = await axios.get(repoInfoUrl, {
      headers: {
        Authorization: `Bearer ${repoToken}`,
      },
    });

    const owner = repoInfoResponse.data.owner.login;
    const repo = repoInfoResponse.data.name;

    const commitDiffUrl = `https://api.github.com/repos/${owner}/${repo}/commits/${commitHash}`;
    const commitDiffResponse = await axios.get(commitDiffUrl, {
      headers: {
        Authorization: `Bearer ${repoToken}`,
      },
    });

    const patchContent = commitDiffResponse.data.files.map(file => file.patch).join('\n\n');

    const diffLines = patchContent.split('\n');

    const prompt = diffLines.slice(0, 5).join('\n');

    const messages = [
      { role: 'user', content: `Summarize the following Git diff:\n${prompt}` },
    ];

    const response = await openai.chat.completions.create({
      messages,
      model: 'text-embedding-ada-002',
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

export { main };