export type User = {
  uuid: string;
  created_at: string;
  updated_at: string;
  full_name?: string;
  avatar_url?: string;
  expo_push_token?: string;
  reminder_settings: {
    yearly: boolean;
    quarterly: boolean;
    timeOfDay: "morning" | "evening";
  };
  is_suspended: boolean;
  following: Follow[];
  followers: Follow[];
};
export type Tag = {
  uuid: string;
  created_at: string;
  updated_at: string;
  name: string;
};
export type Testimony = {
  uuid: string;
  created_at: string;
  updated_at: string;
  date: string;
  text: string;
  is_public: boolean;
  is_private: boolean;
  image_url?: string;
  user_uuid: string;
  user: User;
  bible_verse?: string;
  tags?: string[];
  reminders?: Reminder[];
};
export type Reminder = {
  uuid: string;
  created_at: string;
  user_uuid: string;
  testimony_uuid: string;
  scheduled_for: string;
  sent_at: string;
  type?: ReminderType;
};
export enum ReminderType {
  ONE_TIME = "one-time",
  YEARLY = "yearly",
  QUARTERLY = "quarterly",
  BI_WEEKLY = "bi-weekly",
}
export type AppNotification = {
  uuid: string;
  created_at: string;
  user_uuid: string;
  type: AppNotificationType;
  title: string;
  body: string;
  read: boolean;
  data: AppNotificationData;
};
export enum AppNotificationType {
  REMINDER = "reminder",
  LIKE = "like",
  COMMENT = "comment",
}
export type AppNotificationData = {
  reminder_uuid?: string;
  testimony_uuid?: string;
};
export type Follow = {
  uuid: string;
  created_at: string;
  follower_uuid: string;
  followed_uuid: string;
  follower: User;
  followed: User;
};
export type Comment = {
  uuid: string;
  created_at: string;
  user_uuid: string;
  testimony_uuid: string;
  text: string;
  user: User;
};
