import preacher1 from "@/assets/preacher-1.jpg";
import preacher2 from "@/assets/preacher-2.jpg";
import preacher3 from "@/assets/preacher-3.jpg";
import preacher4 from "@/assets/preacher-4.jpg";
import preacher5 from "@/assets/preacher-5.jpg";
import preacher6 from "@/assets/preacher-6.jpg";

export interface Sermon {
  id: string;
  title: string;
  theme: string;
  duration: string;
  date: string;
}

export interface Preacher {
  id: string;
  name: string;
  photo: string;
  sermons: Sermon[];
}

export const preachers: Preacher[] = [
  {
    id: "1",
    name: "Pastor James Okafor",
    photo: preacher1,
    sermons: [
      { id: "s1", title: "Walking by Faith, Not by Sight", theme: "Faith", duration: "38:12", date: "Jan 7, 2025" },
      { id: "s2", title: "The Substance of Things Hoped For", theme: "Faith", duration: "42:05", date: "Feb 14, 2025" },
      { id: "s3", title: "Building a Godly Marriage", theme: "Marriage", duration: "35:20", date: "Mar 3, 2025" },
      { id: "s4", title: "Love That Endures", theme: "Marriage", duration: "29:45", date: "Apr 12, 2025" },
      { id: "s5", title: "Finding Your Divine Purpose", theme: "Purpose", duration: "44:30", date: "May 8, 2025" },
    ],
  },
  {
    id: "2",
    name: "Rev. Margaret Ellis",
    photo: preacher2,
    sermons: [
      { id: "s6", title: "Grace in the Wilderness", theme: "Grace", duration: "33:15", date: "Jan 21, 2025" },
      { id: "s7", title: "Unmerited Favor", theme: "Grace", duration: "40:00", date: "Mar 18, 2025" },
      { id: "s8", title: "The Peace That Passes Understanding", theme: "Peace", duration: "36:50", date: "Feb 9, 2025" },
      { id: "s9", title: "Restoring Inner Calm", theme: "Peace", duration: "28:30", date: "Apr 27, 2025" },
    ],
  },
  {
    id: "3",
    name: "Pastor Daniel Rivera",
    photo: preacher3,
    sermons: [
      { id: "s10", title: "Bold Faith in Uncertain Times", theme: "Faith", duration: "41:20", date: "Jan 14, 2025" },
      { id: "s11", title: "The Armor of God", theme: "Spiritual Warfare", duration: "45:10", date: "Feb 28, 2025" },
      { id: "s12", title: "Standing Firm Against the Enemy", theme: "Spiritual Warfare", duration: "37:55", date: "Mar 22, 2025" },
    ],
  },
  {
    id: "4",
    name: "Mother Grace Adeyemi",
    photo: preacher4,
    sermons: [
      { id: "s13", title: "The Praying Woman", theme: "Prayer", duration: "39:40", date: "Jan 5, 2025" },
      { id: "s14", title: "Intercession That Moves Mountains", theme: "Prayer", duration: "34:25", date: "Feb 16, 2025" },
      { id: "s15", title: "Healing for the Brokenhearted", theme: "Healing", duration: "43:00", date: "Mar 9, 2025" },
      { id: "s16", title: "Wholeness in Christ", theme: "Healing", duration: "31:15", date: "Apr 5, 2025" },
      { id: "s17", title: "Walking in Your Purpose", theme: "Purpose", duration: "38:50", date: "May 14, 2025" },
      { id: "s18", title: "Seasons of Preparation", theme: "Purpose", duration: "36:10", date: "Jun 1, 2025" },
    ],
  },
  {
    id: "5",
    name: "Pastor David Chen",
    photo: preacher5,
    sermons: [
      { id: "s19", title: "The Heart of Worship", theme: "Worship", duration: "32:45", date: "Jan 19, 2025" },
      { id: "s20", title: "Sacrificial Praise", theme: "Worship", duration: "29:30", date: "Mar 2, 2025" },
      { id: "s21", title: "Renewing Your Mind", theme: "Faith", duration: "40:15", date: "Apr 20, 2025" },
    ],
  },
  {
    id: "6",
    name: "Pastor Sarah Mitchell",
    photo: preacher6,
    sermons: [
      { id: "s22", title: "Raising Godly Children", theme: "Family", duration: "37:20", date: "Feb 2, 2025" },
      { id: "s23", title: "The Blessing of Unity", theme: "Family", duration: "33:55", date: "Mar 15, 2025" },
      { id: "s24", title: "Hope in the Storm", theme: "Hope", duration: "41:40", date: "Apr 8, 2025" },
      { id: "s25", title: "Anchored in Hope", theme: "Hope", duration: "30:10", date: "May 22, 2025" },
    ],
  },
];
