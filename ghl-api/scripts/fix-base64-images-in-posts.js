/**
 * Script to fix posts containing embedded base64 images
 * Extracts base64 images, uploads them to GoHighLevel storage, 
 * and replaces them with URL references
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const FormData = require('form-data');

const prisma = new PrismaClient();

if (!process.env.PRIVATE_INTEGRATION_TOKEN || !process.env.LOCATION_ID) {
  console.error('Error: PRIVATE_INTEGRATION_TOKEN and LOCATION_ID must be set in environment variables');
  process.exit(1);
}

/**
 * Extract base64 images from HTML content
 */
function extractBase64Images(html) {
  const base64Regex = /<img[^>]+src="data:image\/([^;]+);base64,([^"]+)"[^>]*>/g;
  const images = [];
  let match;

  while ((match = base64Regex.exec(html)) !== null) {
    images.push({
      fullMatch: match[0],
      mimeType: match[1],
      base64Data: match[2],
      // Extract alt text if present
      altText: match[0].match(/alt="([^"]*)"/)?.[1] || ''
    });
  }

  return images;
}

/**
 * Upload base64 image to GoHighLevel storage
 */
async function uploadBase64ImageToGHL(base64Data, mimeType) {
  try {
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Check file size (5MB limit)
    const fileSizeInMB = buffer.length / (1024 * 1024);
    if (fileSizeInMB > 5) {
      throw new Error(`File size ${fileSizeInMB.toFixed(2)}MB exceeds 5MB limit`);
    }

    // Determine file extension
    const extension = mimeType === 'jpeg' || mimeType === 'jpg' ? 'jpg' : mimeType;
    const filename = `blog-image-${Date.now()}.${extension}`;

    // Create form data
    const formData = new FormData();
    formData.append('locationId', process.env.LOCATION_ID);
    formData.append('file', buffer, {
      filename,
      contentType: `image/${mimeType}`
    });

    // Upload using axios (same as mediasController.ts)
    const response = await axios.post(
      'https://services.leadconnectorhq.com/medias/upload-file',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${process.env.PRIVATE_INTEGRATION_TOKEN}`,
          'Version': '2021-07-28'
        },
        timeout: 30000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    const mediaUrl = response.data.url || response.data.fileUrl || response.data.src || response.data.mediaUrl;
    
    if (!mediaUrl) {
      console.error('No media URL in response:', response.data);
      throw new Error('Upload succeeded but no media URL returned');
    }

    return mediaUrl;
  } catch (error) {
    console.error('Error uploading image to GoHighLevel:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Process a single post
 */
async function processPost(postId) {
  try {
    console.log(`\nProcessing post: ${postId}`);
    
    // Fetch the post
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      console.error(`Post ${postId} not found`);
      return false;
    }

    if (!post.body) {
      console.log('Post has no body content');
      return false;
    }

    // Extract base64 images
    const base64Images = extractBase64Images(post.body);
    
    if (base64Images.length === 0) {
      console.log('No base64 images found in post');
      return false;
    }

    console.log(`Found ${base64Images.length} base64 image(s)`);

    let updatedBody = post.body;
    let uploadCount = 0;

    // Process each image
    for (const image of base64Images) {
      try {
        console.log(`  Uploading image (${image.mimeType})...`);
        console.log(`  Base64 data size: ${(image.base64Data.length * 0.75 / 1024 / 1024).toFixed(2)} MB`);
        
        // Upload the image
        const uploadedUrl = await uploadBase64ImageToGHL(image.base64Data, image.mimeType);
        console.log(`  ✓ Uploaded: ${uploadedUrl}`);

        // Replace in HTML
        const newImgTag = `<img src="${uploadedUrl}" alt="${image.altText || 'Image'}">`;
        updatedBody = updatedBody.replace(image.fullMatch, newImgTag);
        uploadCount++;
      } catch (error) {
        console.error(`  ✗ Failed to upload image:`, error.message);
      }
    }

    if (uploadCount > 0) {
      // Update the post
      await prisma.post.update({
        where: { id: postId },
        data: { body: updatedBody }
      });
      
      console.log(`✓ Post updated successfully (${uploadCount}/${base64Images.length} images replaced)`);
      return true;
    } else {
      console.log('✗ No images were successfully uploaded');
      return false;
    }
  } catch (error) {
    console.error('Error processing post:', error);
    return false;
  }
}

/**
 * Find all posts with base64 images
 */
async function findPostsWithBase64Images() {
  try {
    const posts = await prisma.post.findMany({
      where: {
        body: {
          contains: 'data:image/'
        }
      },
      select: {
        id: true,
        title: true
      }
    });

    return posts;
  } catch (error) {
    console.error('Error finding posts:', error);
    return [];
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  
  try {
    if (args.length > 0 && args[0] !== '--all') {
      // Process specific post ID
      const postId = args[0];
      const success = await processPost(postId);
      process.exit(success ? 0 : 1);
    } else if (args[0] === '--all') {
      // Find and process all posts with base64 images
      console.log('Searching for posts with base64 images...\n');
      const posts = await findPostsWithBase64Images();
      
      if (posts.length === 0) {
        console.log('No posts found with base64 images');
        process.exit(0);
      }

      console.log(`Found ${posts.length} post(s) with base64 images:\n`);
      posts.forEach((post, index) => {
        console.log(`${index + 1}. ${post.id} - ${post.title}`);
      });
      console.log();

      let successCount = 0;
      for (const post of posts) {
        const success = await processPost(post.id);
        if (success) successCount++;
      }

      console.log(`\n✓ Processed ${successCount}/${posts.length} posts successfully`);
      process.exit(0);
    } else {
      console.log('Usage:');
      console.log('  node fix-base64-images-in-posts.js <post-id>  # Fix specific post');
      console.log('  node fix-base64-images-in-posts.js --all      # Fix all posts with base64 images');
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
