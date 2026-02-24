import { NextRequest, NextResponse } from "next/server";

import { v2 as cloudinary } from "cloudinary";

import { auth } from "@clerk/nextjs/server";

// Configuration
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//for typescript, we can define an interface for the expected result from Cloudinary's upload response
interface CloudinaryUploadResult {
  public_id: string;
  [key: string]: any; // Include other properties returned by Cloudinary
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    //array-buffer take the file 'file' and convert it to low-lvl code
    //not as .png, .mp3... it consider just file just as a file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<CloudinaryUploadResult>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "images" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result as CloudinaryUploadResult);
          },
        );
        uploadStream.end(buffer);
      },
    );
    return NextResponse.json({ publicId: result.public_id }, { status: 200 });
  } catch (error) {
    console.log("Upload img falied", error);
    return NextResponse.json({ error: "Upload img failed" }, { status: 500 });
  }
}

// import { v2 as cloudinary } from "cloudinary";
// import { NextRequest, NextResponse } from "next/server";
// import { auth } from "@clerk/nextjs/server";

// // Configuration
// cloudinary.config({
//   cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// //for typescript, we can define an interface for the expected result from Cloudinary's upload response
// interface CloudinaryUploadResult {
//   public_id: string;
//   [key: string]: any; // Include other properties returned by Cloudinary
// }

// export async function POST(request: NextRequest) {}
