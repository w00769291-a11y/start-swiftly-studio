import catSports from "@/assets/cat-sports.jpg";
import catMusic from "@/assets/cat-music.jpg";
import catCulture from "@/assets/cat-culture.jpg";
import catGaming from "@/assets/cat-gaming.jpg";
import catArts from "@/assets/cat-arts.jpg";
import catFestivals from "@/assets/cat-festivals.jpg";
import evAthletics from "@/assets/ev-athletics.jpg";
import evMusic from "@/assets/ev-music.jpg";
import evKochi from "@/assets/ev-kochi.jpg";
import evEsports from "@/assets/ev-esports.jpg";
import evMumbai from "@/assets/ev-mumbai.jpg";
import liveFootball from "@/assets/live-football.jpg";
import liveDiwali from "@/assets/live-diwali.jpg";
import liveKabaddi from "@/assets/live-kabaddi.jpg";
import storyCricket from "@/assets/story-cricket.jpg";
import storyCollege from "@/assets/story-college.jpg";
import storyGallery from "@/assets/story-gallery.jpg";
import storyChess from "@/assets/story-chess.jpg";
import athBoxer from "@/assets/ath-boxer.jpg";
import artSitar from "@/assets/art-sitar.jpg";
import clubSkate from "@/assets/club-skate.jpg";

export type Category = "Sports" | "Music" | "Culture" | "Gaming" | "Arts" | "Festivals";

export const categories: { name: Category; img: string; w: number; h: number; count: string; blurb: string }[] = [
  { name: "Sports", img: catSports, w: 1024, h: 1280, count: "1,240", blurb: "Leagues, championships, trials" },
  { name: "Music", img: catMusic, w: 1024, h: 768, count: "860", blurb: "Gigs, festivals, open mics" },
  { name: "Culture", img: catCulture, w: 768, h: 1024, count: "530", blurb: "Classical, heritage, traditions" },
  { name: "Gaming", img: catGaming, w: 1024, h: 768, count: "410", blurb: "LAN cups, esports, arenas" },
  { name: "Arts", img: catArts, w: 768, h: 1024, count: "690", blurb: "Exhibitions, murals, workshops" },
  { name: "Festivals", img: catFestivals, w: 1024, h: 768, count: "320", blurb: "Holi to Hornbill, and more" },
];

export type SacEvent = {
  slug: string;
  name: string;
  category: Category;
  city: string;
  state: string;
  venue: string;
  date: string;
  time: string;
  price: number;
  img: string;
  w: number;
  h: number;
  mode: "Offline" | "Online" | "Hybrid";
  organizer: string;
  description: string;
};

export const events: SacEvent[] = [
  { slug: "national-athletics-championship", name: "National Athletics Championship", category: "Sports", city: "Bhubaneswar", state: "Odisha", venue: "Kalinga Stadium", date: "12 Oct 2026", time: "07:00 AM", price: 199, img: evAthletics, w: 1024, h: 768, mode: "Offline", organizer: "Athletics Federation Circuit", description: "Four days of sprints, hurdles, jumps and throws as India's fastest and strongest chase national titles and international qualification marks." },
  { slug: "bengaluru-music-festival", name: "Bengaluru Music Festival", category: "Music", city: "Bengaluru", state: "Karnataka", venue: "Embassy Riding School", date: "24 Oct 2026", time: "03:00 PM", price: 1499, img: evMusic, w: 768, h: 1024, mode: "Offline", organizer: "Garden City Live", description: "Two stages, twenty-plus acts and a sunset that the whole city shows up for. Indie, electronic, fusion and folk, all in one field." },
  { slug: "kochi-cultural-festival", name: "Kochi Cultural Festival", category: "Culture", city: "Kochi", state: "Kerala", venue: "Fort Kochi Parade Ground", date: "02 Nov 2026", time: "05:00 PM", price: 0, img: evKochi, w: 1024, h: 768, mode: "Offline", organizer: "Kochi Heritage Collective", description: "Chenda melam, caparisoned elephants, Kathakali and Theyyam — a week-long celebration of Kerala's living traditions." },
  { slug: "hyderabad-esports-open", name: "Hyderabad Esports Open", category: "Gaming", city: "Hyderabad", state: "Telangana", venue: "HITEX Arena", date: "15 Nov 2026", time: "11:00 AM", price: 299, img: evEsports, w: 1024, h: 768, mode: "Hybrid", organizer: "Deccan Esports League", description: "India's open-bracket esports weekend. Qualify online, play the finals on the main stage in front of 5,000 fans." },
  { slug: "mumbai-live-experience", name: "Mumbai Live Experience", category: "Arts", city: "Mumbai", state: "Maharashtra", venue: "Prithvi Studio, Juhu", date: "22 Nov 2026", time: "07:30 PM", price: 799, img: evMumbai, w: 1024, h: 768, mode: "Offline", organizer: "Studio Juhu", description: "An immersive, one-light theatre experience that moves through the audience. Limited seating, unforgettable nights." },
  { slug: "isl-derby-night", name: "Kolkata Derby Night", category: "Sports", city: "Kolkata", state: "West Bengal", venue: "Salt Lake Stadium", date: "Today", time: "07:30 PM", price: 349, img: liveFootball, w: 768, h: 1024, mode: "Offline", organizer: "Bengal Football Assoc.", description: "The rivalry that stops a city. Floodlights, rain or shine." },
  { slug: "deepotsav-street-festival", name: "Deepotsav Street Festival", category: "Festivals", city: "Jaipur", state: "Rajasthan", venue: "Johari Bazaar", date: "Tonight", time: "06:00 PM", price: 0, img: liveDiwali, w: 768, h: 1024, mode: "Offline", organizer: "Pink City Collective", description: "A night market of lamps, lanterns, sweets and music through the old city." },
  { slug: "pro-kabaddi-playoffs", name: "Kabaddi League Playoffs", category: "Sports", city: "Pune", state: "Maharashtra", venue: "Balewadi Sports Complex", date: "18 Oct 2026", time: "08:00 PM", price: 249, img: liveKabaddi, w: 768, h: 1024, mode: "Offline", organizer: "Kabaddi Pro Circuit", description: "Raids, tackles and super-tens as the top four fight for the final." },
  { slug: "goa-sunset-music-run", name: "Goa Sunset Music Run", category: "Music", city: "Panaji", state: "Goa", venue: "Miramar Beach", date: "08 Nov 2026", time: "05:30 PM", price: 499, img: evMusic, w: 768, h: 1024, mode: "Offline", organizer: "Coastline Collective", description: "A sunset 5K followed by live bands and beach food stalls on the sand." },
  { slug: "chennai-heritage-walk", name: "Chennai Heritage Walk", category: "Culture", city: "Chennai", state: "Tamil Nadu", venue: "Mylapore Temple Quarter", date: "09 Nov 2026", time: "06:30 AM", price: 0, img: evKochi, w: 1024, h: 768, mode: "Offline", organizer: "Madras Legacy Trails", description: "A guided morning walk through 300-year-old streets, temples and markets." },
  { slug: "delhi-open-art-market", name: "Delhi Open Art Market", category: "Arts", city: "Delhi", state: "Delhi", venue: "Sunder Nursery", date: "21 Nov 2026", time: "11:00 AM", price: 149, img: evMumbai, w: 1024, h: 768, mode: "Offline", organizer: "Delhi Art Week", description: "Eighty artists, print stalls, live mural painting and workshops under the trees." },
  { slug: "national-skate-jam", name: "National Skate Jam", category: "Sports", city: "Bengaluru", state: "Karnataka", venue: "Skate Park Indiranagar", date: "14 Nov 2026", time: "04:00 PM", price: 99, img: clubSkate, w: 768, h: 1024, mode: "Offline", organizer: "India Skate Federation", description: "Open qualifiers, pro demos and a night session with DJ sets under the flyover." },
];

export const featuredSlugs = events.slice(0, 5).map((e) => e.slug);

export const live = [
  { label: "LIVE", event: events[5]!, meta: "2nd half · 1–1" },
  { label: "TODAY", event: events[6]!, meta: "Starts 6:00 PM" },
  { label: "UPCOMING", event: events[7]!, meta: "In 3 weeks" },
  { label: "TRENDING", event: events[3]!, meta: "2.4k registered" },
];

export const stories = [
  { slug: "champions-again", category: "Sports", title: "Champions again: inside the women's team's golden season", date: "25 Sep 2026", img: storyCricket, w: 1280, h: 832 },
  { slug: "college-fest-season", category: "College events", title: "Fest season is here — 40 campuses, one calendar", date: "23 Sep 2026", img: storyCollege, w: 1024, h: 768 },
  { slug: "delhi-art-week", category: "Arts", title: "Delhi Art Week opens with its boldest line-up yet", date: "21 Sep 2026", img: storyGallery, w: 1024, h: 768 },
  { slug: "chess-prodigies", category: "Results", title: "Results: teen prodigies sweep the national rapid", date: "19 Sep 2026", img: storyChess, w: 1024, h: 768 },
];

export const people = [
  { name: "Ananya Rathore", discipline: "Boxing · 57kg", city: "Rohtak", upcoming: "National Boxing Trials — 04 Oct", img: athBoxer, w: 768, h: 1024, type: "Athlete", domains: ["Sports"] as Category[] },
  { name: "Ishaan Mehra", discipline: "Sitar · Hindustani", city: "Varanasi", upcoming: "Baithak Sessions — 11 Oct", img: artSitar, w: 768, h: 1024, type: "Artist", domains: ["Culture"] as Category[] },
  { name: "Pune Skate Club", discipline: "Skateboarding · Club", city: "Pune", upcoming: "Open Jam — 19 Oct", img: clubSkate, w: 768, h: 1024, type: "Club", domains: ["Sports"] as Category[] },
];

export const cities = ["Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Chennai", "Kochi", "Mangaluru", "Pune", "Kolkata"];

export const whatsNext = [
  ...live,
  { label: "TRENDING", event: events[4]!, meta: "Selling fast" },
];

export const news = [
  ...stories,
  { slug: "esports-arena-boom", category: "Gaming", title: "Esports arenas boom as tier-2 cities cash in", date: "17 Sep 2026", img: evEsports, w: 1024, h: 768 },
];

export const upcoming = events.slice(7);

export const formatPrice = (p: number) => (p === 0 ? "Free" : `₹${p.toLocaleString("en-IN")}`);
