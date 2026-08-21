import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary SDK with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true,
});

export const isCloudinaryConfigured = (): boolean => {
  return !!(
    (process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET) ||
    process.env.CLOUDINARY_URL
  );
};

export const uploadImageToCloudinary = async (
  fileData: string,
  folder: string = 'cretivrank_general'
): Promise<string> => {
  try {
    if (!fileData || typeof fileData !== 'string') return fileData;
    if (!isCloudinaryConfigured()) {
      return fileData;
    }

    // Upload base64 or file URI to Cloudinary
    const result = await cloudinary.uploader.upload(fileData, {
      folder: `cretivrank/${folder}`,
      resource_type: 'auto',
    });

    return result.secure_url;
  } catch (error) {
    console.error('⚠️ Cloudinary Upload Error:', error);
    return fileData;
  }
};

/**
 * Uploads media contained within a Question (image attachments, diagrams, option images) to Cloudinary
 */
export const processQuestionCloudinaryMedia = async (questionData: any): Promise<any> => {
  const updatedData = { ...questionData };

  // 1. Upload Question Image / Diagram Attachment
  if (updatedData.imageUrl && updatedData.imageUrl.startsWith('data:image')) {
    updatedData.imageUrl = await uploadImageToCloudinary(updatedData.imageUrl, 'assessment_questions');
  }
  if (updatedData.mediaUrl && updatedData.mediaUrl.startsWith('data:image')) {
    updatedData.mediaUrl = await uploadImageToCloudinary(updatedData.mediaUrl, 'assessment_questions');
  }

  // 2. Upload Option Images (if options contain image URIs)
  if (Array.isArray(updatedData.options)) {
    updatedData.options = await Promise.all(
      updatedData.options.map(async (opt: any) => {
        if (opt.imageUrl && opt.imageUrl.startsWith('data:image')) {
          const cloudinaryUrl = await uploadImageToCloudinary(opt.imageUrl, 'assessment_question_options');
          return { ...opt, imageUrl: cloudinaryUrl };
        }
        return opt;
      })
    );
  }

  return updatedData;
};

/**
 * Uploads media contained within Candidate Submitted Answer (diagrams, code screenshots, attachments) to Cloudinary
 */
export const processAnswerCloudinaryMedia = async (answerVal: any): Promise<{ answer: any; mediaUrl: string }> => {
  let mediaUrl = '';
  let finalAnswer = answerVal;

  if (typeof answerVal === 'string' && answerVal.startsWith('data:image')) {
    mediaUrl = await uploadImageToCloudinary(answerVal, 'candidate_answers');
    finalAnswer = mediaUrl;
  } else if (typeof answerVal === 'object' && answerVal !== null && answerVal.attachment) {
    if (typeof answerVal.attachment === 'string' && answerVal.attachment.startsWith('data:image')) {
      mediaUrl = await uploadImageToCloudinary(answerVal.attachment, 'candidate_answers');
      finalAnswer = { ...answerVal, attachment: mediaUrl };
    }
  }

  return { answer: finalAnswer, mediaUrl };
};

export default cloudinary;
