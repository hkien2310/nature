import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

// Configure Cloudinary using env variables.
// Make sure CLOUDINARY_URL or (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are in your .env.local
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const isCloudinaryConfigured = !!(
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME !== "demo" &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key");
    const expectedKey = process.env.API_SECRET_KEY;
    if (!apiKey || apiKey !== expectedKey) {
      return NextResponse.json({ success: false, error: "Unauthorized: Invalid or missing API key." }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";
    let fileToUpload: string | null = null;
    let folder = "creatures";
    let fileBuffer: Buffer | null = null;
    let fileName = `image_${Date.now()}.png`;

    if (contentType.includes("multipart/form-data")) {
      // Handle local file uploads via FormData
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const imageUrl = formData.get("imageUrl") as string | null;
      folder = (formData.get("folder") as string) || "creatures";

      if (file) {
        // Convert File to Base64 URI for Cloudinary
        const bytes = await file.arrayBuffer();
        fileBuffer = Buffer.from(bytes);
        const base64Data = fileBuffer.toString("base64");
        fileToUpload = `data:${file.type};base64,${base64Data}`;
        fileName = file.name || fileName;
      } else if (imageUrl) {
        fileToUpload = imageUrl;
        if (imageUrl.startsWith("data:")) {
          const matches = imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            fileBuffer = Buffer.from(matches[2], "base64");
          }
        }
      }
    } else if (contentType.includes("application/json")) {
      // Fallback for JSON requests
      const body = await req.json();
      fileToUpload = body.imageUrl || body.base64Data;
      folder = body.folder || "creatures";
      if (fileToUpload && fileToUpload.startsWith("data:")) {
        const matches = fileToUpload.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          fileBuffer = Buffer.from(matches[2], "base64");
        }
      }
    }

    if (!fileToUpload) {
      return NextResponse.json(
        { success: false, error: "Missing 'file', 'imageUrl', or 'base64Data' in request." },
        { status: 400 }
      );
    }

    // If Cloudinary is not configured, write file to local public folder instead
    if (!isCloudinaryConfigured) {
      console.log("Cloudinary not configured. Falling back to local upload.");

      if (!fileBuffer) {
        if (fileToUpload.startsWith("data:")) {
          const matches = fileToUpload.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            fileBuffer = Buffer.from(matches[2], "base64");
          }
        } else if (fileToUpload.startsWith("http")) {
          // Fetch remote image
          const res = await fetch(fileToUpload);
          if (res.ok) {
            const arrayBuffer = await res.arrayBuffer();
            fileBuffer = Buffer.from(arrayBuffer);
            const urlParts = fileToUpload.split("/");
            fileName = urlParts[urlParts.length - 1] || fileName;
          }
        }
      }

      if (!fileBuffer) {
        return NextResponse.json(
          { success: false, error: "Could not retrieve image buffer for local saving." },
          { status: 400 }
        );
      }

      // Ensure local target directory exists
      const uploadDir = path.join(process.cwd(), "public/uploads", folder);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Make filename safe and write the file
      const safeName = fileName.replace(/[^a-zA-Z0-9_.-]/g, "_");
      const filePath = path.join(uploadDir, safeName);
      fs.writeFileSync(filePath, fileBuffer);

      const localUrl = `/uploads/${folder}/${safeName}`;
      console.log(`Saved file locally to: ${filePath}. Accessible at: ${localUrl}`);

      return NextResponse.json({
        success: true,
        public_id: localUrl,
        url: localUrl,
        format: path.extname(safeName).replace(".", ""),
        width: 800,
        height: 800,
      });
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

