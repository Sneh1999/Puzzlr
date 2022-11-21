export const pageview = (url: string) => {
  // @ts-ignore
  window.gtag("config", process.env.NEXT_PUBLIC_GTAG_KEY, {
    page_path: url,
  });
};

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({ action, category, label, value }) => {
  // @ts-ignore
  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};
