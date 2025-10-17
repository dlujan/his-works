export type Comment = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};

export type Testimony = {
  id: string;
  author: string;
  title: string;
  excerpt: string;
  body: string;
  createdAt: string;
  likes: number;
  comments: Comment[];
};

export const testimonies: Testimony[] = [
  {
    id: "1",
    author: "Grace Thompson",
    title: "Finding Peace After Loss",
    excerpt:
      "When I felt utterly alone, a simple prayer changed everything. Here's how grace met me in my grief.",
    body: `Last year I lost my father unexpectedly, and the days that followed felt like walking through a fog. I didn't have the words to pray, so I simply sat in silence. One evening, I whispered, "Lord, hold me," and in that moment I felt a calm warmth resting over me. The grief didn't disappear, but I found the strength to take each day gently. Friends came alongside me, scripture came alive (especially Psalm 34:18), and I learned that hope can bloom even in broken seasons.`,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    likes: 24,
    comments: [
      {
        id: "c1",
        author: "Matthew R.",
        body: "Thank you for sharing, Grace. That verse carried me too when I lost my brother.",
        createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      },
      {
        id: "c2",
        author: "Sofia L.",
        body: "Sending love and prayers. Your story is a reminder that God is close.",
        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      },
    ],
  },
  {
    id: "2",
    author: "Daniel Kim",
    title: "Provision in the Unexpected",
    excerpt:
      "Our family was on the edge financially when an unexpected promotion arrived—right after a faith step.",
    body: `Earlier this spring my wife and I felt nudged to support a missions trip, even though our savings were thin. We decided to give anyway, trusting God with the rest. Two weeks later, my manager called me into his office to let me know about a new project lead role opening up—one I hadn't even applied for. The promotion came with a raise that covered the exact amount we had given. It was a vivid reminder that obedience is rarely about the outcome, but God loves to surprise us.`,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    likes: 41,
    comments: [
      {
        id: "c3",
        author: "Heather",
        body: "This is beautiful. We've been praying over a similar decision—thank you for the encouragement!",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      },
    ],
  },
  {
    id: "3",
    author: "Marisol Reyes",
    title: "Healing Through Community",
    excerpt:
      "I struggled with anxiety for years, but it was vulnerability in small group that opened the door to healing.",
    body: `Sharing my anxiety battles felt impossible until my small group leader shared their own story first. That night, I let the guard down I had built for so long. People listened without fixing, prayed without assuming, and the Holy Spirit met us with a deep sense of peace. Since then I've started counseling and put healthy rhythms in place. It's a journey, but I'm no longer walking alone.`,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    likes: 67,
    comments: [
      {
        id: "c4",
        author: "Jon V.",
        body: "Appreciate your honesty. Community has been key for me too.",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      },
      {
        id: "c5",
        author: "Kara",
        body: "Cheering you on, Marisol! Thankful you're finding support.",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
      },
    ],
  },
];

export function getTestimonyById(id: string) {
  return testimonies.find((testimony) => testimony.id === id);
}
