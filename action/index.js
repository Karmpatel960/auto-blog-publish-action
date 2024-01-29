const axios = require("axios");
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const getGitPushNumber = () => {
  const pushEventPath = process.env.GITHUB_EVENT_PATH;
  if (fs.existsSync(pushEventPath)) {
    const pushEvent = JSON.parse(fs.readFileSync(pushEventPath, 'utf8'));
    return pushEvent && pushEvent.number;
  }
  return null;
};

const getGitProjectName = () => {
  const repositoryPath = process.env.GITHUB_REPOSITORY;
  const parts = repositoryPath.split('/');
  return parts[1] || 'Unknown Project';
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
  const commitTitle = process.env.GITHUB_EVENT_NAME === "push" ? await getLatestCommitTitle() : 'N/A';
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