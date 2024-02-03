import { createRequire as __WEBPACK_EXTERNAL_createRequire } from "module";
/******/ var __webpack_modules__ = ({

/***/ 389:
/***/ ((module) => {

module.exports = eval("require")("@actions/exec");


/***/ }),

/***/ 103:
/***/ ((module) => {

module.exports = eval("require")("axios");


/***/ }),

/***/ 208:
/***/ ((module) => {

module.exports = eval("require")("dotenv");


/***/ })

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __nccwpck_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	var threw = true;
/******/ 	try {
/******/ 		__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 		threw = false;
/******/ 	} finally {
/******/ 		if(threw) delete __webpack_module_cache__[moduleId];
/******/ 	}
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/compat */
/******/ 
/******/ if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = new URL('.', import.meta.url).pathname.slice(import.meta.url.match(/^file:\/\/\/\w:/) ? 1 : 0, -1) + "/";
/******/ 
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {

;// CONCATENATED MODULE: external "child_process"
const external_child_process_namespaceObject = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("child_process");
;// CONCATENATED MODULE: external "fs"
const external_fs_namespaceObject = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("fs");
;// CONCATENATED MODULE: external "path"
const external_path_namespaceObject = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("path");
// EXTERNAL MODULE: C:\Users\PATEL KARM\AppData\Roaming\npm\node_modules\@vercel\ncc\dist\ncc\@@notfound.js?axios
var C_Users_PATEL_KARM_AppData_Roaming_npm_node_modules_vercel_ncc_dist_ncc_notfoundaxios = __nccwpck_require__(103);
// EXTERNAL MODULE: C:\Users\PATEL KARM\AppData\Roaming\npm\node_modules\@vercel\ncc\dist\ncc\@@notfound.js?dotenv
var C_Users_PATEL_KARM_AppData_Roaming_npm_node_modules_vercel_ncc_dist_ncc_notfounddotenv = __nccwpck_require__(208);
// EXTERNAL MODULE: C:\Users\PATEL KARM\AppData\Roaming\npm\node_modules\@vercel\ncc\dist\ncc\@@notfound.js?@actions/exec
var exec = __nccwpck_require__(389);
;// CONCATENATED MODULE: ./src/publish.mjs





// import OpenAI from "openai";


C_Users_PATEL_KARM_AppData_Roaming_npm_node_modules_vercel_ncc_dist_ncc_notfounddotenv.config();

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

const getGitPushNumber = async () => {
  let gitPushNumber;
  try {
    let commitMessage = '';
    await (0,exec.exec)('git', ['log', '--format=%B', '-n', '1'], {
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
    await (0,exec.exec)('git', ['rev-parse', '--show-toplevel'], {
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
    
    const response = await C_Users_PATEL_KARM_AppData_Roaming_npm_node_modules_vercel_ncc_dist_ncc_notfoundaxios.get(apiUrl, {
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

// const getGitDiffSummary = async () => {
//   const repoToken = process.env.REPO_TOKEN;
//   const commitHash = process.env.GITHUB_SHA;

//   try {
//     const repoInfoUrl = `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}`;
//     const repoInfoResponse = await axios.get(repoInfoUrl, {
//       headers: {
//         Authorization: `Bearer ${repoToken}`,
//       },
//     });

//     const owner = repoInfoResponse.data.owner.login;
//     const repo = repoInfoResponse.data.name;

//     const commitDiffUrl = `https://api.github.com/repos/${owner}/${repo}/commits/${commitHash}`;
//     const commitDiffResponse = await axios.get(commitDiffUrl, {
//       headers: {
//         Authorization: `Bearer ${repoToken}`,
//       },
//     });

//     const patchContent = commitDiffResponse.data.files.map(file => file.patch).join('\n\n');

//     const diffLines = patchContent.split('\n');

//     const prompt = diffLines.slice(0, 5).join('\n');

//     const messages = [
//       { role: 'user', content: `Summarize the following Git diff:\n${prompt}` },
//     ];

//     const response = await openai.chat.completions.create({
//       messages,
//       model: 'gpt-3.5-turbo',
//     });

//     if (response && response.choices && response.choices.length > 0) {
//       const summary = response.choices[0].message.content.trim();
//       console.log('Summary:', summary);
//       return summary;
//     } else {
//       console.error('Error retrieving summary from ChatGPT.');
//       return null;
//     }
//   } catch (error) {
//     console.error('Error getting Git diff summary:', error.message);
//     return null;
//   }
// };

// const getGitDiffFile = async () => {
//   const repoToken = process.env.REPO_TOKEN;
//   const commitHash = process.env.GITHUB_SHA;

//   try {
//     const repoInfoUrl = `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}`;
//     const repoInfoResponse = await axios.get(repoInfoUrl, {
//       headers: {
//         Authorization: `Bearer ${repoToken}`,
//       },
//     });

//     const owner = repoInfoResponse.data.owner.login;
//     const repo = repoInfoResponse.data.name;

//     const commitDiffUrl = `https://api.github.com/repos/${owner}/${repo}/commits/${commitHash}.diff`;
//     const commitDiffResponse = await axios.get(commitDiffUrl, {
//       headers: {
//         Authorization: `Bearer ${repoToken}`,
//       },
//     });

//     return commitDiffResponse.data;
//   } catch (error) {
//     console.error('Error getting Git diff file:', error.message);
//     return null;
//   }
// };


const getGitDiff = async () => {
  const repoToken = process.env.REPO_TOKEN;
  const commitHash = process.env.GITHUB_SHA;

  try {
    const repoInfoUrl = `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}`;
    const repoInfoResponse = await C_Users_PATEL_KARM_AppData_Roaming_npm_node_modules_vercel_ncc_dist_ncc_notfoundaxios.get(repoInfoUrl, {
      headers: {
        Authorization: `Bearer ${repoToken}`,
      },
    });

    const owner = repoInfoResponse.data.owner.login;
    const repo = repoInfoResponse.data.name;

    const commitDiffUrl = `https://api.github.com/repos/${owner}/${repo}/commits/${commitHash}`;
    const commitDiffResponse = await C_Users_PATEL_KARM_AppData_Roaming_npm_node_modules_vercel_ncc_dist_ncc_notfoundaxios.get(commitDiffUrl, {
      headers: {
        Authorization: `Bearer ${repoToken}`,
      },
    });

    const filesAdded = commitDiffResponse.data.files.filter(file => file.status === 'added');
    const filesDeleted = commitDiffResponse.data.files.filter(file => file.status === 'deleted');
    const filesModified = commitDiffResponse.data.files.filter(file => file.status === 'modified');

    const addedFilesSummary = filesAdded.map(file => {
      return `
#### Added: ${file.filename}
\`\`\`diff
${file.patch}
\`\`\`
`;
    }).join('\n');

    const deletedFilesSummary = filesDeleted.map(file => `#### Deleted: ${file.filename}`).join('\n');

    const modifiedFilesSummary = filesModified.map(file => {
      return `
#### Modified: ${file.filename}
\`\`\`diff
${file.patch}
\`\`\`
`;
    }).join('\n');

    const summary = `
## Git Summary
${addedFilesSummary}
${deletedFilesSummary}
${modifiedFilesSummary}
    `;

    console.log('Summary:', summary);
    return summary;
  } catch (error) {
    console.error('Error getting Git diff summary:', error.message);
    return null;
  }
};

const generateBlogContent = async () => {
  try {
    const gitPushNumber = await getGitPushNumber();
    const commitDetails = await getGitCommitDetails();
    // const changesSummary = await getGitDiffSummary();
    const codeChanges = await getGitDiff();
    
    const contributorsPhotos = await getContributorsPhotos();
    
    return `
## Github Project Detail
#### Git Push Number: ${gitPushNumber}
#### Commit Number: [${commitDetails.number}](${commitDetails.link})
    
## Changes Summary

${codeChanges}
  
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
    const response = await C_Users_PATEL_KARM_AppData_Roaming_npm_node_modules_vercel_ncc_dist_ncc_notfoundaxios.get(contributor.url, {
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
  
  const response = await C_Users_PATEL_KARM_AppData_Roaming_npm_node_modules_vercel_ncc_dist_ncc_notfoundaxios.get(apiUrl, {
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
    const response = await C_Users_PATEL_KARM_AppData_Roaming_npm_node_modules_vercel_ncc_dist_ncc_notfoundaxios.post(
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


;// CONCATENATED MODULE: ./index.mjs

 
main();

})();

