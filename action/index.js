const fs = require('fs');
const path = require('path');
const axios = require('axios');

const postsDir = path.join(__dirname, '..', 'posts');

const getGitPushNumber = () => {
  const pushEventPath = process.env.GITHUB_EVENT_PATH;
  if (fs.existsSync(pushEventPath)) {
    const pushEvent = JSON.parse(fs.readFileSync(pushEventPath, 'utf8'));
    return pushEvent && pushEvent.number;
  }
  return null;
};

const generateBlogContent = async () => {
  const gitPushNumber = getGitPushNumber();
  const changesSummary = 'Summary of changes'; // Implement logic to get changes summary
  const codeChanges = 'Code changes'; // Implement logic to get code changes

  return `
    # Git Push Number: ${gitPushNumber}

    ## Changes Summary
    ${changesSummary}

    ## Code Changes
    \`\`\`
    ${codeChanges}
    \`\`\`
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
          _id
          title
          slug
          publishedAt
        }
      }
    }
  `;

  const variables = {
    input: {
      title: 'Your Blog Post Title',
      subtitle: 'Your Blog Post Subtitle',
      publicationId: hashnodeBlogId,
      contentMarkdown: await generateBlogContent(),
      publishedAt: new Date().toISOString(),
      // Add other required fields as needed
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
          'Authorization': `${hashnodeApiKey}`,
        },
      }
    );

    if (response.data.errors) {
      console.error('Error publishing blog post:', response.data.errors);
    } else {
      const publishedPost = response.data.data.publishPost.post;
      console.log('Blog post published successfully:', publishedPost.title);
    }
  } catch (error) {
    console.error('Error publishing blog post:', error.message);
  }
};

const main = async () => {
  await publishBlogPost();
};

main();


