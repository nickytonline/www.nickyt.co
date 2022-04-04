#!/usr/bin/env node
require('dotenv').config();

const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs').promises;
const {DEV_API_KEY, NODE_ENV} = process.env;

const DEV_TO_API_URL = 'https://dev.to/api/articles/me/published?per_page=1000';
const POSTS_DIRECTORY = path.join(__dirname, '../src/posts');
const POSTS_IMAGES_PUBLIC_DIRECTORY = '/images/posts';
const POSTS_IMAGES_DIRECTORY = path.join(
  __dirname,
  '../src',
  POSTS_IMAGES_PUBLIC_DIRECTORY
);

let {url: siteUrl} = require('../src/_data/site.json');

if (!DEV_API_KEY) {
  throw new Error('Missing DEV_API_KEY environment variable');
}

/**
 * Determine whether or not a file exists.
 *
 * @param {string} path
 *
 * @returns True if the file exists, otherwise false.
 */
async function fileExists(path) {
  return !!(await fs.stat(path).catch(_error => false));
}

/**
 * Ensures that embeds coming from dev.to that are strings are in quotes in the markdown.
 * Otherwise Eleventy misinterprets and tries to parse them as a number.
 *
 * @param {string} markdown
 *
 * @returns sanitized markdown
 */
function sanitizeMarkdownEmbeds(markdown) {
  const sanitizedMarkdown = markdown.replaceAll(
    /{%\s*?(?<shortcode>[^\s+]*)\s+?(?<id>[^'"\s]+)\s*?%}/g,
    '{% $1 "$2" %}'
  );

  return sanitizedMarkdown;
}

/**
 * Determines whethere or not a post coming from DEV (the CMS) is valid or not to publish
 * on this blog.
 *
 * @param {object} post The post to validate.
 *
 * @returns {boolean} True if the post is valid for publishing, otherwise false.
 */
function isValidPost(post) {
  const {tag_list: tags = []} = post;

  return (
    !tags.includes('jokes') &&
    !tags.includes('weeklylearn') &&
    !tags.includes('weeklyretro') &&
    !tags.includes('watercooler') &&
    !tags.includes('devhumor') &&
    !tags.includes('discuss') &&
    !tags.includes('vscodetip') &&
    !tags.includes('explainlikeimfive')
  );
}

/*

Sample post format:

{
  "title": "Strongly Typed JSON in TypeScript",
  "description": "Someone in one of the Slack communities I'm a part of asked today how to type JSON in TypeScript,...",
  "published": true,
  "published_at": "2022-04-01T03:36:19.595Z",
  "slug": "strongly-typed-json-in-typescript-5gb2",
  "published_timestamp": "2022-04-01T03:36:19Z",
  "body_markdown": "Someone in one of the Slack communities I'm a part of asked today how to type JSON in TypeScript, specifically importing JSON and then typing it. They wondered if casting the JSON to `unknown` and then casting to a known type when consumed was a good approach.\n\nThe solution is not that complicated. We just need to get our hands a little dirty and dig into the TypeScript compiler options for our project.\n\nBy default, if you import JSON, TypeScript will mention that it can't import it with the following error message:\n\n`Cannot find module './data.json'. Consider using '--resolveJsonModule' to import module with '.json' extension.ts(2732)`\n\n![](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/s5csqewe14a9n4kr523d.png)\n\nSo TypeScript tells us what to do. Add the `--resolveJsonModule` flag. This is helpful if we're running the TypeScript CLI, but that is not what we're doing. What needs to be done is to add the `resolveJsonModule` key to the compiler options in the tsconfig.json file and set it to `true`.\n\n```json\n{\n  \"compilerOptions\": {\n    \"resolveJsonModule\": true,\n    // more awesome compiler options\n  }\n}\n```\n\nOnce that's done, you'll notice that if you type `data.`, we have fully typed JSON data.\n\n![data variable in VS Code displaying autocomplete with properties of the data object](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/w5o2nxl0hik2gwhpy6m1.png)\n\nThis is great for using data in a typed manner, but what if we needed the JSON type elsewhere in the project? We can create a type for it using `typeof`.\n\n`type PersonalInfo = typeof data;`\n\n![The type PersonalInfo displaying its shape in CodeSandbox](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/g5sbz0a6386yfgwz7376.png)\n\nYou can play around with this CodeSandbox and have some fun seeing it all in action.\n\n{%codesandbox zealous-marco-urxdvy %}",
  "cover_image": "https://res.cloudinary.com/practicaldev/image/fetch/s--kzB8DJTv--/c_imagga_scale,f_auto,fl_progressive,h_420,q_auto,w_1000/https://dev-to-uploads.s3.amazonaws.com/uploads/articles/7sjay11pqa91it8euj0l.png",
  "tag_list": [
    "typescript",
    "beginners"
  ],
  "reading_time_minutes": 2,
}

*/

/**
 * Retrieves the latest blog posts from dev.to.
 *
 * @returns {Promise<object[]>} A promise that resolves to an array of blog posts.
 */
async function getDevPosts() {
  const response = await fetch(DEV_TO_API_URL, {
    headers: {
      'api-key': DEV_API_KEY
    }
  });
  const posts = await response.json();

  return posts.filter(isValidPost);
}

/**
 * Generates a markdown file for the given blog post.
 *
 * @param {object} post The blog post to generate a markdown file for.
 */
async function createPostFile(post) {
  const {
    body_markdown,
    title,
    description: excerpt,
    published_at: date,
    tag_list: tags,
    cover_image,
    slug
  } = post;
  const jsonFrontmatter = {title, excerpt, date, tags, cover_image, template: 'post'};
  let markdownBody;

  if (/^---\n/.test(body_markdown)) {
    // v1 editor
    markdownBody = body_markdown.replace(/^---\n(.|[\r\n])*?---\n*/, '');
  } else {
    markdownBody = body_markdown;
  }

  const markdown = `---json\n${JSON.stringify(
    jsonFrontmatter,
    null,
    2
  )}\n---\n${markdownBody}\n`;

  const postFile = path.join(POSTS_DIRECTORY, `${slug}.md`);
  await fs.writeFile(postFile, sanitizeMarkdownEmbeds(markdown));

  return {status: 'success'};
}

/**
 * Save an image URL to a local file.
 *
 * @param {string} imageUrl The URL of the image to save.
 * @param {string} imageFilePath The path to save the image to.
 *
 */
async function saveImageUrl(imageUrl, imageFilePath) {
  const response = await fetch(imageUrl);
  const buffer = await response.buffer();

  await fs.writeFile(imageFilePath, buffer, () =>
    console.log(`Saved image ${imageUrl} to ${imageFilePath}!`)
  );
}

/**
 * Generates an image URL hosted by the domain the blog is hosted on.
 *
 * @param {URL} imageUrl
 * @returns {string} The new image URL.
 */
function generateNewImageUrl(imageUrl) {
  const imagefilename = imageUrl.pathname.replaceAll('/', '_');
  const newImageUrl = new URL(
    siteUrl + path.join(POSTS_IMAGES_PUBLIC_DIRECTORY, imagefilename)
  ).toString();

  return newImageUrl;
}

/**
 * Saves a markdown image URL to a local file and returns the new image URL.
 * TODO: Fix mixing two concerns.
 * @param {string} markdownImageUrl
 *
 * @returns {string} Returns the new image URL.
 */
async function saveMarkdownImageUrl(markdownImageUrl = null) {
  let newMarkdownImageUrl = null;

  if (markdownImageUrl) {
    const imageUrl = new URL(markdownImageUrl);
    const imagefilename = imageUrl.pathname.replaceAll('/', '_');
    const localCoverImagePath = path.join(POSTS_IMAGES_DIRECTORY, imagefilename);

    newMarkdownImageUrl = generateNewImageUrl(imageUrl);

    if (!(await fileExists(localCoverImagePath))) {
      console.log(`Saving image ${imageUrl} to ${localCoverImagePath}`);
      await saveImageUrl(markdownImageUrl, localCoverImagePath);
    }
  }

  return newMarkdownImageUrl;
}

/**
 * Saves all markdown images to local files to be served by the blog.
 *
 * @param {string[]} imagesToSave
 */
async function saveMarkdownImages(imagesToSave) {
  for (const imageToSave of imagesToSave) {
    await saveMarkdownImageUrl(imageToSave);
  }
}

/**
 * Updates all markdown image URLs with URLs hosted by the domain the blog is hosted on.
 * @param {string} markdown
 *
 * @returns The updated markdown.
 */
async function updateMarkdownImageUrls(markdown) {
  let updatedMarkdown = markdown;
  const imagesToSave = [];
  const matches = markdown.matchAll(/!\[.*?\]\((?<oldImageUrl>.*?)\)/g);

  for (const match of matches) {
    const {oldImageUrl} = match.groups;

    const imageUrl = new URL(oldImageUrl);

    if (!imageUrl.host.includes('giphy.com')) {
      const newImageUrl = generateNewImageUrl(imageUrl);

      updatedMarkdown = updatedMarkdown.replace(oldImageUrl, newImageUrl);
      imagesToSave.push(oldImageUrl);
    }
  }

  return {
    markdown: updatedMarkdown,
    imagesToSave
  };
}

(async () => {
  await fs.mkdir(POSTS_DIRECTORY, {recursive: true});
  await fs.mkdir(POSTS_IMAGES_DIRECTORY, {recursive: true});

  const posts = await getDevPosts();

  for (const post of posts) {
    const updatedCoverImage = await saveMarkdownImageUrl(post.cover_image);
    const {markdown, imagesToSave} = await updateMarkdownImageUrls(post.body_markdown);

    await saveMarkdownImages(imagesToSave);

    const updatedPost = {
      ...post,
      cover_image: updatedCoverImage,
      body_markdown: markdown
    };
    const {status} = await createPostFile(updatedPost);

    if (status !== 'success') {
      console.error(`Failed to create post file for ${JSON.stringify(post, null, 2)}`);

      throw new Error(`Unabled to generate markdown file: status ${status}`);
    }
  }
})();