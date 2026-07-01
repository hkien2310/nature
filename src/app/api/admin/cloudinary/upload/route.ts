import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary using env variables.
// Make sure CLOUDINARY_URL or (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are in your .env.local
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let fileToUpload: string | null = null;
    let folder = "creatures";

    if (contentType.includes("multipart/form-data")) {
      // Handle local file uploads via FormData
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const imageUrl = formData.get("imageUrl") as string | null;
      folder = (formData.get("folder") as string) || "creatures";

      if (file) {
        // Convert File to Base64 URI for Cloudinary
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Data = buffer.toString("base64");
        fileToUpload = `data:${file.type};base64,${base64Data}`;
      } else if (imageUrl) {
        fileToUpload = imageUrl;
      }
    } else if (contentType.includes("application/json")) {
      // Fallback for JSON requests
      const body = await req.json();
      fileToUpload = body.imageUrl || body.base64Data;
      folder = body.folder || "creatures";
    }

    if (!fileToUpload) {
      return NextResponse.json(
        { success: false, error: "Missing 'file', 'imageUrl', or 'base64Data' in request." },
        { status: 400 }
      );
    }

    // Call Cloudinary API
    const result = await cloudinary.uploader.upload(fileToUpload, {
      folder: folder, // Organize uploads in folders
    });

    return NextResponse.json({
      success: true,
      public_id: result.public_id,
      url: result.secure_url,
      format: result.format,
      width: result.width,
      height: result.height,
    });
  } catch (error: any) {
    console.error("Cloudinary Upload Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to upload image to Cloudinary." },
      { status: 500 }
    );
  }
}
