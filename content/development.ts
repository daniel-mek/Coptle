import type { Difficulty } from "../lib/catalog";

type Source = { explanation: string; reference: string };
type Word = Source & { game: "word"; answer: string };
type Saint = Source & { game: "saintle"; answer: string; aliases: string[]; region: string; vocation: string };
type Verse = Source & { game: "versele"; answer: string; prompt: string; options?: string[] };
export type Puzzle = Word | Saint | Verse;

export const wordPuzzles: Record<Difficulty, Word[]> = {
  beginner: [
    { game: "word", answer: "faith", explanation: "Faith is trust in God. Hebrews describes faith through examples of people who trusted God's promises.", reference: "Hebrews 11" },
    { game: "word", answer: "grace", explanation: "Paul speaks of salvation as a gift of God.", reference: "Ephesians 2:8–10" },
  ],
  intermediate: [
    { game: "word", answer: "prayer", explanation: "Jesus teaches his disciples how to pray.", reference: "Matthew 6:5–13" },
    { game: "word", answer: "exodus", explanation: "Exodus recounts the departure of the Israelites from Egypt.", reference: "Exodus 12" },
  ],
  advanced: [
    { game: "word", answer: "dormition", explanation: "Dormition means falling asleep and is used in the name of the feast commemorating the death of the Virgin Mary.", reference: "Coptic Synaxarium, 21 Tobe (verify before publication)" },
    { game: "word", answer: "covenant", explanation: "Genesis recounts God's covenant with Abraham.", reference: "Genesis 17" },
  ],
};

export const saintPuzzles: Record<Difficulty, Saint[]> = {
  beginner: [
    { game: "saintle", answer: "Mark the Evangelist", aliases: ["mark", "saint mark"], region: "Alexandria", vocation: "Evangelist", explanation: "Coptic tradition honors Mark as the founder of the Church of Alexandria.", reference: "Coptic Synaxarium, 30 Baramouda (verify before publication)" },
    { game: "saintle", answer: "Anthony the Great", aliases: ["anthony", "saint anthony"], region: "Egypt", vocation: "Monastic", explanation: "Anthony is remembered for his life of prayer in the Egyptian desert.", reference: "Athanasius, Life of Antony" },
  ],
  intermediate: [
    { game: "saintle", answer: "Athanasius of Alexandria", aliases: ["athanasius", "athanasius the apostolic"], region: "Alexandria", vocation: "Bishop", explanation: "Athanasius served as bishop of Alexandria and wrote On the Incarnation.", reference: "Athanasius, On the Incarnation" },
    { game: "saintle", answer: "Moses the Strong", aliases: ["moses", "moses the black"], region: "Egypt", vocation: "Monastic", explanation: "Moses is remembered among the Egyptian Desert Fathers.", reference: "Sayings of the Desert Fathers, Moses" },
  ],
  advanced: [
    { game: "saintle", answer: "Samuel the Confessor", aliases: ["samuel"], region: "Egypt", vocation: "Monastic", explanation: "Samuel is associated with the monastery at al-Qalamun.", reference: "Life of Samuel of Qalamun (verify before publication)" },
    { game: "saintle", answer: "Shenoute the Archimandrite", aliases: ["shenoute", "shenouda"], region: "Upper Egypt", vocation: "Monastic", explanation: "Shenoute led the monastic community associated with the White Monastery.", reference: "Life of Shenoute, attributed to Besa (verify before publication)" },
  ],
};

export const versePuzzles: Record<Difficulty, Verse[]> = {
  beginner: [
    { game: "versele", answer: "Jonah", prompt: "Which prophet was swallowed by a great fish?", options: ["Elijah", "Jonah", "Isaiah", "Jeremiah"], explanation: "Jonah prays from inside the fish.", reference: "Jonah 1:17–2:10" },
    { game: "versele", answer: "Luke", prompt: "Which Gospel tells the parable of the Good Samaritan?", options: ["Mark", "Luke", "John", "Matthew"], explanation: "Jesus tells this parable in response to a question about who counts as a neighbor.", reference: "Luke 10:25–37" },
  ],
  intermediate: [
    { game: "versele", answer: "Acts 9", prompt: "Name the book and chapter where Saul encounters Jesus on the road to Damascus.", explanation: "Saul encounters Jesus as he approaches Damascus.", reference: "Acts 9:1–19" },
    { game: "versele", answer: "John 11", prompt: "Name the book and chapter that recounts Jesus raising Lazarus.", explanation: "Jesus calls Lazarus out of the tomb after speaking to Martha and Mary.", reference: "John 11:1–44" },
  ],
  advanced: [
    { game: "versele", answer: "Philippians 2:7", prompt: "Give the precise reference where Paul describes Christ taking the form of a servant.", explanation: "The verse is part of Paul's appeal to follow Christ's humility.", reference: "Philippians 2:5–11" },
    { game: "versele", answer: "Hebrews 11:1", prompt: "Give the precise reference for the definition of faith opening the chapter about faithful witnesses.", explanation: "The chapter goes on to recount examples of faith.", reference: "Hebrews 11:1" },
  ],
};

// Development-only fixtures. This library has no scheduled daily entries.
export const practicePuzzles: Record<Difficulty, Record<Puzzle["game"], Puzzle>> = {
  beginner: {
    word: { game: "word", answer: "psalm", explanation: "The Book of Psalms collects prayers and songs.", reference: "Psalm 1" },
    saintle: { game: "saintle", answer: "Mary, the Mother of Jesus", aliases: ["mary", "virgin mary"], region: "Galilee", vocation: "Mother of Jesus", explanation: "Luke recounts Gabriel's visit to Mary in Nazareth.", reference: "Luke 1:26–38" },
    versele: { game: "versele", answer: "Peter", prompt: "Which disciple stepped out of the boat toward Jesus?", options: ["John", "Andrew", "Peter", "Philip"], explanation: "Jesus reaches out when the disciple begins to sink.", reference: "Matthew 14:22–33" },
  },
  intermediate: {
    word: { game: "word", answer: "gospel", explanation: "The word gospel means good news.", reference: "Mark 1:1" },
    saintle: { game: "saintle", answer: "Paul the Apostle", aliases: ["paul", "saul of tarsus"], region: "Tarsus", vocation: "Apostle", explanation: "Paul identified Tarsus as his birthplace.", reference: "Acts 22:3" },
    versele: { game: "versele", answer: "Acts 2", prompt: "Name the book and chapter describing the descent of the Holy Spirit at Pentecost.", explanation: "The gathering hears a sound like a rushing wind.", reference: "Acts 2:1–13" },
  },
  advanced: {
    word: { game: "word", answer: "theosis", explanation: "Theosis refers to participation in the divine life by grace.", reference: "2 Peter 1:4 (verify explanation before publication)" },
    saintle: { game: "saintle", answer: "Stephen the Protomartyr", aliases: ["stephen", "stephen the first martyr"], region: "Jerusalem", vocation: "One of the Seven", explanation: "Acts names Stephen among the seven appointed to serve the community.", reference: "Acts 6:1–8" },
    versele: { game: "versele", answer: "2 Timothy 3:16", prompt: "Give the precise reference that describes Scripture as God-breathed and useful for instruction.", explanation: "The surrounding passage discusses the role of Scripture in forming a life of faith.", reference: "2 Timothy 3:14–17" },
  },
};
