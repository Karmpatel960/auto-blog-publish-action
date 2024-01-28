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

const publishBlogPost = async (content) => {
  const hashnodeApiKey = process.env.HASHNODE_API_KEY;
  const apiUrl = 'https://api.hashnode.com';

  try {
    const response = await axios.post(
      `${apiUrl}/v1/blog/YOUR_HASHNODE_BLOG_ID/stories`, // Replace with your actual Hashnode blog ID
      {
        title: `Blog Post - Git Push #${getGitPushNumber()}`,
        content,
        publishDate: new Date().toISOString(),
        isRepublished: false,
      },
      {
        headers: {
          Authorization: `Bearer ${hashnodeApiKey}`,
        },
      }
    );

    console.log('Blog post published successfully:', response.data.url);
  } catch (error) {
    console.error('Error publishing blog post:', error.message);
  }
};

const main = async () => {
  const blogContent = await generateBlogContent();
  await publishBlogPost(blogContent);
};

