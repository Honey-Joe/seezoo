import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import mongoose from "mongoose";
import User from "../models/User";
import Post from "../models/Post";

/* ── static data pools ── */

const FIRST_NAMES = [
  "Liam","Emma","Noah","Olivia","Ethan","Ava","Mason","Sophia","Logan","Isabella",
  "Lucas","Mia","James","Charlotte","Aiden","Amelia","Jackson","Harper","Sebastian","Evelyn",
  "Carter","Abigail","Owen","Emily","Wyatt","Elizabeth","Jack","Mila","Luke","Ella",
  "Henry","Scarlett","Gabriel","Grace","Samuel","Chloe","Matthew","Victoria","Ryan","Riley",
  "Nathan","Aria","Caleb","Lily","Isaac","Zoey","Hunter","Nora","Eli","Hannah",
];

const LAST_NAMES = [
  "Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Wilson","Moore",
  "Taylor","Anderson","Thomas","Jackson","White","Harris","Martin","Thompson","Young","Lee",
  "Walker","Hall","Allen","King","Wright","Scott","Green","Baker","Adams","Nelson",
  "Carter","Mitchell","Perez","Roberts","Turner","Phillips","Campbell","Parker","Evans","Edwards",
  "Collins","Stewart","Sanchez","Morris","Rogers","Reed","Cook","Morgan","Bell","Murphy",
];

const BIOS = [
  "Proud pet parent 🐾", "Life is better with animals 🐶",
  "My pets are my world 🌍", "Fur baby obsessed 😍",
  "Animal lover & proud of it 🐱", "Pets make everything better 🐾",
  "Living my best life with my fur babies", "Rescue pet advocate 🐕",
  "Every day is better with a wagging tail", "Crazy pet person and loving it",
  "My pets run this household 🏠", "Spoiling my pets since day one",
  "Pet photographer & enthusiast 📸", "Adopted not shopped 🐾",
  "Pets are family, not property 💕",
];

const LOCATIONS = [
  "New York, NY","Los Angeles, CA","Chicago, IL","Houston, TX","Phoenix, AZ",
  "Philadelphia, PA","San Antonio, TX","San Diego, CA","Dallas, TX","San Jose, CA",
  "Austin, TX","Jacksonville, FL","Fort Worth, TX","Columbus, OH","Charlotte, NC",
  "Indianapolis, IN","San Francisco, CA","Seattle, WA","Denver, CO","Nashville, TN",
];

const PET_NAMES = [
  "Buddy","Max","Charlie","Cooper","Rocky","Bear","Duke","Tucker","Oliver","Milo",
  "Bella","Luna","Lucy","Daisy","Lola","Sadie","Molly","Maggie","Sophie","Chloe",
  "Coco","Biscuit","Peanut","Ginger","Pepper","Oreo","Brownie","Caramel","Mocha","Hazel",
  "Zeus","Thor","Apollo","Odin","Loki","Ares","Atlas","Titan","Rex","Ace",
];

const PET_BREEDS: Record<string, string[]> = {
  dog:     ["Golden Retriever","Labrador","Poodle","Bulldog","Beagle","German Shepherd","Husky","Corgi","Dachshund","Shih Tzu"],
  cat:     ["Persian","Siamese","Maine Coon","Ragdoll","Bengal","Sphynx","British Shorthair","Scottish Fold","Abyssinian","Birman"],
  bird:    ["Parakeet","Cockatiel","Lovebird","African Grey","Macaw","Canary","Finch","Conure","Cockatoo","Budgie"],
  rabbit:  ["Holland Lop","Mini Rex","Lionhead","Dutch","Flemish Giant","Angora","Rex","Netherland Dwarf","Californian","Harlequin"],
  fish:    ["Betta","Goldfish","Guppy","Angelfish","Clownfish","Neon Tetra","Oscar","Discus","Koi","Molly"],
  reptile: ["Bearded Dragon","Leopard Gecko","Ball Python","Blue-tongued Skink","Chameleon","Crested Gecko","Corn Snake","Iguana","Tortoise","Monitor Lizard"],
  other:   ["Guinea Pig","Hamster","Ferret","Chinchilla","Hedgehog","Sugar Glider","Axolotl","Tarantula","Hermit Crab","Capybara"],
};

const PET_BIOS = [
  "The goodest boy/girl in the world 🐾",
  "Loves cuddles and treats equally",
  "Professional napper and treat inspector",
  "Will do anything for belly rubs",
  "Certified zoomies expert",
  "Thinks they're a lap dog regardless of size",
  "Steals hearts and socks",
  "Living their best life one nap at a time",
  "Chief household supervisor",
  "Fluffy chaos agent",
];

const CAPTIONS = [
  "This face could melt anyone's heart 🥰",
  "Monday mood ft. my best friend 🐾",
  "When they look at you like this... 😍",
  "Caught them being absolutely adorable again",
  "The real boss of this household 👑",
  "Zoomies o'clock! 🏃",
  "Nap time is the best time 😴",
  "This cuteness should be illegal 🚨",
  "My whole heart in one photo 💕",
  "They said smile for the camera... 📸",
  "Living their best life and I'm here for it",
  "Weekend plans: cuddles and more cuddles 🤗",
  "Plot twist: they own me, not the other way around",
  "Treat time is their favorite time 🦴",
  "The way they look at me 🥺",
  "Officially the cutest thing I've ever seen",
  "Another day, another adorable moment 🌟",
  "They woke up like this and it's perfect",
  "My therapist has four paws 🐾",
  "Happiness is a warm pet 💛",
];

// Real Unsplash pet image URLs (stable CDN links)
const PET_IMAGES = [
  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600",
  "https://images.unsplash.com/photo-1552053831-71594a27632d?w=600",
  "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=600",
  "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=600",
  "https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=600",
  "https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=600",
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600",
  "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600",
  "https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=600",
  "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600",
  "https://images.unsplash.com/photo-1533743983669-94fa5c4338ec?w=600",
  "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=600",
  "https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?w=600",
  "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=600",
  "https://images.unsplash.com/photo-1520315342629-6ea920342047?w=600",
  "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600",
  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600",
  "https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=600",
  "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600",
  "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=600",
];

const PROFILE_IMAGES = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
  "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200",
];

/* ── helpers ── */
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const pickN = <T>(arr: T[], n: number): T[] => [...arr].sort(() => 0.5 - Math.random()).slice(0, n);
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const SPECIES_LIST = ["dog","cat","bird","rabbit","fish","reptile","other"] as const;
type Species = typeof SPECIES_LIST[number];
const SPECIES_MUT = [...SPECIES_LIST] as Species[];

/* ── main seed ── */
const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("✅ Connected to MongoDB");

    const createdUsers: mongoose.Types.ObjectId[] = [];

    console.log("\n👥 Creating 50 users with pets...");

    for (let i = 0; i < 50; i++) {
      const firstName = FIRST_NAMES[i];
      const lastName  = LAST_NAMES[i];
      const name      = `${firstName} ${lastName}`;
      const username  = `${firstName.toLowerCase()}${lastName.toLowerCase()}${rand(10, 99)}`;
      const email     = `${username}@seezoo.dev`;

      // Skip if already exists
      const exists = await User.findOne({ email });
      if (exists) {
        console.log(`  ⚠️  Skipping ${email} (already exists)`);
        createdUsers.push(exists._id as mongoose.Types.ObjectId);
        continue;
      }

      // Build 1–3 pets
      const petCount = rand(1, 3);
      const pets = Array.from({ length: petCount }, () => {
        const species = pick(SPECIES_MUT) as Species;
        return {
          name:         pick(PET_NAMES),
          species,
          breed:        pick(PET_BREEDS[species]),
          age:          rand(1, 12),
          bio:          pick(PET_BIOS),
          profileImage: pick(PET_IMAGES),
        };
      });

      const user = new User({
        name,
        username,
        email,
        password:        "Password@123",
        role:            "user",
        isEmailVerified: true,
        authProvider:    "local",
        isBlocked:       false,
        bio:             pick(BIOS),
        profileImage:    pick(PROFILE_IMAGES),
        pets,
      });

      await user.save();
      createdUsers.push(user._id as mongoose.Types.ObjectId);
      process.stdout.write(`  ✅ ${i + 1}/50 ${name} (@${username}) — ${petCount} pet(s)\n`);
    }

    // Add random followers/following between users
    console.log("\n🔗 Adding follow relationships...");
    for (const userId of createdUsers) {
      const toFollow = pickN(
        createdUsers.filter((id) => !id.equals(userId)),
        rand(5, 15)
      );
      await User.findByIdAndUpdate(userId, { $addToSet: { following: { $each: toFollow } } });
      for (const followedId of toFollow) {
        await User.findByIdAndUpdate(followedId, { $addToSet: { followers: userId } });
      }
    }

    // Create 2–5 posts per user
    console.log("\n📸 Creating posts...");
    let totalPosts = 0;

    for (const userId of createdUsers) {
      const user      = await User.findById(userId).lean();
      if (!user) continue;

      const postCount = rand(2, 5);

      for (let p = 0; p < postCount; p++) {
        const imageCount = rand(1, 3);
        const images     = pickN(PET_IMAGES, imageCount);

        // Random likes from other users
        const likers = pickN(
          createdUsers.filter((id) => !id.equals(userId)),
          rand(0, 20)
        );

        // Random comments
        const commentCount = rand(0, 4);
        const comments = Array.from({ length: commentCount }, () => ({
          _id:       new mongoose.Types.ObjectId(),
          user:      pick(createdUsers.filter((id) => !id.equals(userId))),
          text:      pick([
            "So cute! 😍", "Adorable! 🐾", "Love this! ❤️",
            "What a cutie!", "This made my day 🥰", "Precious! 💕",
            "Goals 🐶", "Omg I'm obsessed 😭", "The cutest thing ever!",
            "This is everything 🌟",
          ]),
          createdAt: new Date(Date.now() - rand(0, 30) * 86400000),
        }));

        // Tag one of the user's pets if they have any
        const petTags = user.pets.length > 0 && Math.random() > 0.4
          ? [(user.pets[rand(0, user.pets.length - 1)] as unknown as { _id: mongoose.Types.ObjectId })._id]
          : [];

        await Post.create({
          user:            userId,
          images,
          caption:         pick(CAPTIONS),
          location:        Math.random() > 0.4 ? pick(LOCATIONS) : undefined,
          petTags,
          commentsEnabled: true,
          likes:           likers,
          comments,
        });

        totalPosts++;
      }

      process.stdout.write(`  📸 Posts created for @${user.username}\n`);
    }

    console.log("\n🎉 Seeding complete!");
    console.log("─────────────────────────────────────────────");
    console.log(`  👥 Users created/updated : ${createdUsers.length}`);
    console.log(`  📸 Posts created         : ${totalPosts}`);
    console.log(`  🔑 Password for all      : Password@123`);
    console.log("─────────────────────────────────────────────");

  } catch (err) {
    console.error("❌ Seed failed:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seed();
