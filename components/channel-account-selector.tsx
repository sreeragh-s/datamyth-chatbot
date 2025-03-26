"use client"

import { useState, useEffect } from "react"
import { ChevronRight, Search } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"

// Define types for our data
interface Channel {
  id: string
  name: string
  icon: string
  type: string
}

interface Account {
  id: string
  name: string
  accountId: string
  channelId: string
}

// Define supported channel types
const SUPPORTED_TYPES = ['Google Ads', 'Facebook Ads', 'GA4', 'Google Search Console'];

// Update channels mapping
const channelTypeToIcon: Record<string, string> = {
  'Google Ads': '/google-ads.png',
  'Facebook Ads': '/facebook-ads.png',
  'GA4': '/google-analytics.png',
  'Google Search Console': '/google-search-console.png',
};

interface ChannelAccountSelectorProps {
  integrationData: any[];
  onSelectIntegration: (integration: any) => void;
}

export function ChannelAccountSelector({ integrationData, onSelectIntegration }: ChannelAccountSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Process integration data to get unique channels
  const channels: Channel[] = Array.from(
    new Set(integrationData.map(int => int.type))
  )
    .filter(type => SUPPORTED_TYPES.includes(type))
    .map(type => ({
      id: type.toLowerCase().replace(/\s+/g, '-'),
      name: type,
      icon: channelTypeToIcon[type],
      type: type
    }));

  const [selectedChannel, setSelectedChannel] = useState(channels[0] || null);
  const [selectedAccount, setSelectedAccount] = useState(integrationData[0] || null);

  // Filter channels and accounts based on search
  const filteredChannels = channels.filter(
    channel => channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const channelAccounts = integrationData.filter(
    account => account.type === selectedChannel?.type
  );

  const filteredAccounts = channelAccounts.filter(
    account => account.account_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Update handlers
  const handleSelectChannel = (channel: Channel) => {
    setSelectedChannel(channel);
    const firstAccount = integrationData.find(acc => acc.type === channel.type);
    if (firstAccount) {
      setSelectedAccount(firstAccount);
      onSelectIntegration(firstAccount);
    }
  };

  const handleSelectAccount = (account: any) => {
    setSelectedAccount(account);
    onSelectIntegration(account);
    setOpen(false);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="flex items-center text-left space-x-2 hover:bg-gray-100 rounded-md p-4 transition-colors">
            <div className="flex  gap-2 items-center">
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Channel</span>
                <span className="text-xl font-semibold">{selectedChannel?.name}</span>
              </div>
              <ChevronRight className="h-6 w-6 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Account</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">{selectedAccount?.name}</span>
                  <span className="text-lg text-muted-foreground">({selectedAccount?.account_id})</span>
                </div>
              </div>
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[600px] p-0" align="start">
          <div className="p-4 bg-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search"
                className="pl-9 bg-white rounded-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2">
            <div className="border-r">
              <div className="p-3 font-medium border-b bg-gray-100">Channel</div>
              <div className="max-h-[300px] overflow-y-auto">
                {filteredChannels.map((channel) => (
                  <button
                    key={channel.id}
                    className={`flex items-center gap-3 w-full p-4 text-left hover:bg-gray-100 transition-colors ${
                      channel.id === selectedChannel?.id ? "bg-gray-50" : ""
                    }`}
                    onClick={() => handleSelectChannel(channel)}
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-white rounded-md flex items-center justify-center shadow-sm">
                      <Image src={channel.icon || "/placeholder.svg"} alt={channel.name} width={24} height={24} />
                    </div>
                    <span className="font-medium">{channel.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="p-3 font-medium border-b bg-gray-100">Account</div>
              <div className="max-h-[300px] overflow-y-auto">
                {filteredAccounts.length > 0 ? (
                  filteredAccounts.map((account) => (
                    <div key={account.id}>
                      <button
                        className={`flex flex-col w-full p-4 text-left hover:bg-gray-100 transition-colors ${
                          account.id === selectedAccount?.id ? "bg-gray-50" : ""
                        }`}
                        onClick={() => handleSelectAccount(account)}
                      >
                        <span className="font-medium">{account.name}</span>
                        <span className="text-muted-foreground">{account.account_id}</span>
                      </button>
                      <Separator />
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground">No accounts found for this channel</div>
                )}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

