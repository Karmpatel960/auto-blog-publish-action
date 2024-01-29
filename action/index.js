const axios = require("axios");
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const core = require('@actions/core');
const exec = require('@actions/exec');

const getGitPushNumber = async () => {
  let gitPushNumber;
  await exec.exec('git', ['rev-list', '--count', '--all'], {
    listeners: {
      stdout: (data) => {
        gitPushNumber = data.toString().trim();
      },
    },
  });
  return gitPushNumber;
};

const getGitProjectName = async () => {
  let gitProjectName;
  await exec.exec('basename "$(git rev-parse --show-toplevel)"', [], {
    listeners: {
      stdout: (data) => {
        gitProjectName = data.toString().trim();
      },
    },
  });
  return gitProjectName;
};


const getLatestCommitTitle = async () => {
  const commitSha = process.env.GITHUB_SHA;
  const apiUrl = `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/commits/${commitSha}`;
  
  try {
    const response = await axios.get(apiUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      },
    });

    return response.data.commit.message;
  } catch (error) {
    console.error('Error fetching latest commit:', error.message);
    return 'N/A';
  }
};

const generateBlogContent = async () => {
  const gitPushNumber = getGitPushNumber();
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
      title: `Github Project ${getGitProjectName()} Summary - Issue #${getGitPushNumber()}`,
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