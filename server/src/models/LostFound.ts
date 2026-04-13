import mongoose, { Document, Schema } from "mongoose";

export type ReportType = "lost" | "found";
export type PetSize   = "tiny" | "small" | "medium" | "large" | "extra-large";
export type PetGender = "male" | "female" | "unknown";
export type PetSpecies = "dog" | "cat" | "bird" | "rabbit" | "fish" | "reptile" | "other";

export interface ILostFound extends Document {
  user: mongoose.Types.ObjectId;

  /* report meta */
  type: ReportType;           // "lost" = owner lost pet | "found" = found a stray
  isResolved: boolean;        // marked resolved when pet is returned

  /* pet details */
  petName?: string;
  species: PetSpecies;
  breed?: string;
  age?: number;
  gender: PetGender;
  size: PetSize;
  color: string;              // primary colour/markings description
  description: string;        // longer description / distinguishing features
  microchipId?: string;

  /* media */
  photos: string[];           // Cloudinary URLs (≥ 1 required)

  /* location */
  lastSeenLocation: string;   // free-text address / landmark
  lastSeenDate: Date;

  /* contact */
  contactName: string;
  contactPhone: string;
  contactEmail?: string;

  /* reward */
  rewardOffered: boolean;
  rewardAmount?: number;

  createdAt: Date;
  updatedAt: Date;
}

const lostFoundSchema = new Schema<ILostFound>(
  {
    user:               { type: Schema.Types.ObjectId, ref: "User", required: true },

    type:               { type: String, enum: ["lost", "found"], required: true },
    isResolved:         { type: Boolean, default: false },

    petName:            { type: String, trim: true, maxlength: 60 },
    species:            { type: String, enum: ["dog","cat","bird","rabbit","fish","reptile","other"], required: true },
    breed:              { type: String, trim: true, maxlength: 80 },
    age:                { type: Number, min: 0 },
    gender:             { type: String, enum: ["male","female","unknown"], default: "unknown" },
    size:               { type: String, enum: ["tiny","small","medium","large","extra-large"], default: "medium" },
    color:              { type: String, required: true, trim: true, maxlength: 120 },
    description:        { type: String, required: true, trim: true, maxlength: 2000 },
    microchipId:        { type: String, trim: true, maxlength: 30 },

    photos:             { type: [String], required: true,
                          validate: [(v: string[]) => v.length > 0, "At least one photo required"] },

    lastSeenLocation:   { type: String, required: true, trim: true, maxlength: 200 },
    lastSeenDate:       { type: Date, required: true },

    contactName:        { type: String, required: true, trim: true, maxlength: 80 },
    contactPhone:       { type: String, required: true, trim: true, maxlength: 20 },
    contactEmail:       { type: String, trim: true, maxlength: 100 },

    rewardOffered:      { type: Boolean, default: false },
    rewardAmount:       { type: Number, min: 0 },
  },
  { timestamps: true }
);

/* text search index */
lostFoundSchema.index({
  petName: "text", breed: "text", color: "text",
  description: "text", lastSeenLocation: "text",
});

export default mongoose.model<ILostFound>("LostFound", lostFoundSchema);
