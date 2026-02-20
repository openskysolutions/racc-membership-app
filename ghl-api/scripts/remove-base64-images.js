/**
 * Script to remove embedded base64 images from posts
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Remove base64 images from HTML content
 */
function removeBase64Images(html) {
  // Remove base64 image tags completely
  const cleaned = html.replace(/<img[^>]+src="data:image\/[^;]+;base64,[^"]+"[^>]*>/g, '');
  
  // Clean up any extra whitespace left behind
  return cleaned.replace(/\n\s*\n\s*\n/g, '\n\n').trim();
}

/**
 * Process a single post
 */
async function processPost(postId) {
  try {
    console.log(`\nProcessing post: ${postId}`);
    
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, title: true, body: true }
    });

    if (!post) {
      console.error(`Post ${postId} not found`);
      return false;
    }

    if (!post.body) {
      console.log('Post has no body content');
      return false;
    }

    // Check if post has base64 images
    const hasBase64 = /data:image\/[^;]+;base64,/.test(post.body);
    
    if (!hasBase64) {
      console.log('No base64 images found in post');
      return false;
    }

    // Count base64 images
    const matches = post.body.match(/<img[^>]+src="data:image\/[^;]+;base64,[^"]+"[^>]*>/g);
    console.log(`Found ${matches?.length || 0} base64 image(s)`);

    // Calculate sizes
    matches?.forEach((match, index) => {
      const base64Match = match.match(/data:image\/[^;]+;base64,([^"]+)/);
      if (base64Match) {
        const sizeInMB = (base64Match[1].length * 0.75 / 1024 / 1024).toFixed(2);
        console.log(`  Image ${index + 1}: ${sizeInMB} MB`);
      }
    });

    // Remove base64 images
    const updatedBody = removeBase64Images(post.body);

    // Update the post
    await prisma.post.update({
      where: { id: postId },
      data: { body: updatedBody }
    });
    
    console.log(`✓ Post updated - base64 images removed`);
    return true;
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
      console.log('  node remove-base64-images.js <post-id>  # Remove from specific post');
      console.log('  node remove-base64-images.js --all      # Remove from all posts');
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
