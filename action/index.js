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
  `;
};

const publishBlogPost = async (content) => {
    const hashnodeApiKey = process.env.HASHNODE_API_KEY;
    const hashnodeBlogId = process.env.HASHNODE_BLOG_ID;
  
    const apiUrl = 'https://api.hashnode.com';
  
    try {
      const response = await axios.post(
        `${apiUrl}/v1/blog/${hashnodeBlogId}/stories`,
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
  
      if (response.status === 200) {
        console.log('Blog post published successfully:', response.data.url);
      } else {
        console.error('Error publishing blog post. Unexpected status code:', response.status);
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.error('Error publishing blog post. API endpoint not found (404).');
      } else {
        console.error('Error publishing blog post:', error.message);
      }
    }
  };

const main = async () => {
  const blogContent = await generateBlogContent();
  await publishBlogPost(blogContent);
};

main();

