const axios = require("axios");
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const core = require('@actions/core');
const exec = require('@actions/exec');

const getGitPushNumber = async () => {
  let gitPushNumber;
  await exec.exec('git', ['log', '--format=%B', '-n', '1'], {
    listeners: {
      stdout: (data) => {
        const commitMessage = data.toString().trim();
        const match = commitMessage.match(/Issue #(\d+)/i);
        gitPushNumber = match ? match[1] : null;
      },
    },
  });
  return gitPushNumber;
};

const getGitProjectName = async () => {
  let gitProjectPath;
  await exec.exec('git', ['rev-parse', '--show-toplevel'], {
    listeners: {
      stdout: (data) => {
        gitProjectPath = data.toString().trim();
      },
    },
  });

  const pathParts = gitProjectPath.split('/');
  const repoName = pathParts[pathParts.length - 1];

  return repoName;
};




const getLatestCommitTitle = async () => {
  try {
    console.log('GITHUB_TOKEN:', process.env.repo_token); // Make sure the token is available

    const commitSha = process.env.GITHUB_SHA;
    const apiUrl = `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/commits/${commitSha}`;
    
    const response = await axios.get(apiUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.repo_token}`, // Use repo_token as the variable name
      },
    });

    return response.data.commit.message;
  } catch (error) {
    console.error('Error fetching latest commit:', error.message);
    return 'N/A';
  }
};


const generateBlogContent = async () => {
  const gitPushNumber = await getGitPushNumber();
  const commitTitle = await getLatestCommitTitle();
  const changesSummary = 'Summary of changes';
  const codeChanges = 'Code changes'; 

  return `
    # Git Push Number: ${gitPushNumber}

    ## Changes Summary
    ${changesSummary}

    ## Code Changes
    \`\`\`
    ${codeChanges}
    \`\`\`

    ## Latest Commit
    ${commitTitle}
  `;
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
      title: `Github Project ${await getGitProjectName()} Summary - Issue #${await getGitPushNumber()}`,
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

    if (response.data.errors) {
      console.error('API Response:', response.data);
      console.error('Error publishing blog post:', response.data.errors);
    } else {
      const publishedPost = response.data.data.publishPost.post;
      console.log('Blog post published successfully:', publishedPost.title);
    }
  } catch (error) {
    console.log('API Response:', error.response.data);
    console.error('Error publishing blog post:', error.message);
  }
};

const main = async () => {
  await publishBlogPost();
};

main();