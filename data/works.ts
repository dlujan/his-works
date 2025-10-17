export type Work = {
  id: string;
  title: string;
  summary: string;
  details: string;
  updatedAt: string;
};

export const initialWorks: Work[] = [
  {
    id: "1",
    title: "Midweek Outreach Recap",
    summary:
      "Shared testimonies from our downtown outreach where three new families asked for prayer.",
    details:
      "During Wednesday's outreach we met three families who were looking for hope. We listened, prayed, and they asked about joining our small groups. Planning follow-up visits this weekend.",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: "2",
    title: "Youth Worship Night",
    summary:
      "Captured highlights from the youth worship night—several students stepped up to lead.",
    details:
      "Friday's worship night was powerful. Two students shared spontaneous testimonies, and we saw genuine community forming. Next step is to equip them for ongoing leadership.",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "3",
    title: "Community Pantry Update",
    summary:
      "Documented the pantry restock and how we served 42 households this week.",
    details:
      "The pantry received a generous donation that allowed us to restock essentials. Volunteers organized stations and we served 42 households. Need to order more produce before next Tuesday.",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];
