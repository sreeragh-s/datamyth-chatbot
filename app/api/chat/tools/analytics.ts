import { tool } from "ai"
import { z } from "zod"

export const getAnalyticsTool = (accountId: string, channelId: string, currentDate: Date, type: string) => tool({
  description: `Fetch analytics data from ${type}`,
  parameters: z.object({
    type: z.enum([type])
      .describe("The platform to fetch data from"),
    startDate: z.string()
      .default(`${currentDate}`)
      .describe("Start date in YYYY-MM-DD format"),
    endDate: z.string()
      .default(`${currentDate}`)
      .describe("End date in YYYY-MM-DD format"),
    startDate2: z.string()
      .describe("Compare start date (optional)")
      .optional(),
    endDate2: z.string()
      .describe("Compare end date (optional)")
      .optional(),
    metrics: z.array(z.string()).default([]).describe("Metrics to fetch"),
    dimensions: z.array(z.string()).default([]).describe("Dimensions to fetch").optional(),
  }).refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      if (data.startDate2 && data.endDate2) {
        const start2 = new Date(data.startDate2);
        const end2 = new Date(data.endDate2);
        return start <= end && start2 <= end2;
      }
      return start <= end;
    },
    {
      message: "End dates must be more recent than start dates",
      path: ["endDate"],
    }
  ),
  execute: async ({ type, startDate, endDate, startDate2, endDate2, metrics, dimensions }) => {
    console.log('Analytics Tool Execution - Input Parameters:', JSON.stringify({
      type,
      account_id: accountId,
      startDate,
      endDate,
      channel_id: channelId,
      startDate2,
      endDate2,
      metrics,
      dimensions
    }));

    console.log("type", type, "accountId", accountId, "channelId", channelId, "startDate", startDate, "endDate", endDate, "startDate2", startDate2, "endDate2", endDate2, "metrics", metrics, "dimensions", dimensions)
    const response = await fetch('https://api.datamyth.com/api/chat/data2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://console.datamyth.com'
      },
      body: JSON.stringify({
        type,
        account_id: accountId,
        startDate,
        endDate,
        channel_id: channelId,
        startDate2,
        endDate2,
        metrics,
        dimensions
      }),
    });

    console.log("response", response)
    
    console.log('Analytics API Response Status:', response.status);
    
    if (!response.ok) {
      console.error('Analytics API error:', response.statusText);
      return {
        error: true,
        message: `Failed to fetch analytics data: ${response.statusText}`
      };
    }

    try {
      const data = await response.json();
      console.log('Analytics API Response Data:', data);
      return data;
    } catch (error) {
      console.error('Error parsing analytics response:', error);
      return {
        error: true,
        message: 'Failed to parse analytics data'
      };
    }
  },
}) 