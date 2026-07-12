import prisma from "../lib/prisma";
import { deleteFile } from "../lib/storage";

async function main() {
  // Clean up files older than 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  console.log(`[Cleanup] Searching for resources uploaded before ${thirtyDaysAgo.toISOString()}...`);

  const oldResources = await prisma.resource.findMany({
    where: {
      createdAt: {
        lt: thirtyDaysAgo,
      },
    },
  });

  console.log(`[Cleanup] Found ${oldResources.length} old resources to delete.`);

  for (const resource of oldResources) {
    try {
      console.log(`[Cleanup] Deleting resource: '${resource.title}' (${resource.url})...`);
      
      // Delete from local filesystem or Vercel Blob
      await deleteFile(resource.url);
      
      // Delete from database
      await prisma.resource.delete({
        where: { id: resource.id },
      });
      
      console.log(`[Cleanup] Successfully deleted resource: ${resource.title}`);
    } catch (err) {
      console.error(`[Cleanup] Failed to delete resource '${resource.title}':`, err);
    }
  }
}

main()
  .then(() => {
    console.log("[Cleanup] Resource cleanup completed.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("[Cleanup] Error running resource cleanup:", err);
    process.exit(1);
  });
