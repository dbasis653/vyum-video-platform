export const PRESETS = [
  { label: "Free", aspect: undefined, w: undefined, h: undefined },
  { label: "Instagram 1:1", aspect: 1, w: 1080, h: 1080 },
  { label: "Instagram 4:5", aspect: 4 / 5, w: 1080, h: 1350 },
  { label: "Twitter Post", aspect: 16 / 9, w: 1200, h: 675 },
  { label: "Facebook Cover", aspect: 820 / 312, w: 820, h: 312 },
  { label: "YouTube Cover", aspect: 2560 / 1440, w: 2560, h: 1440 },
  { label: "YouTube Profile", aspect: 1, w: 800, h: 800 },
] as const;

export const PRESET_SUFFIX: Record<string, string> = {
  Free: "_cropped",
  "Instagram 1:1": "_inst_1:1",
  "Instagram 4:5": "_inst_4:5",
  "Twitter Post": "_twitter",
  "Facebook Cover": "_fb_cover",
  "YouTube Cover": "_yt_cover",
  "YouTube Profile": "_yt_profile",
};
