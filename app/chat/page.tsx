import ChatBot from "@/components/ui/Chatbot";


const session = "123"
const type = "GA4"
const channelId = "61cd6644714a91c5fddd500b"
const accountName = "Blockware Solutions Website"
const propertyName = "Blockware Solutions"
const accountId = "421612556"

export default function ChatBotPage() {
  return <div className="w-480px h-700px">
    <ChatBot session={session} analyticsType={type} channelId={channelId} accountName={accountName} propertyName={propertyName} accountId={accountId} />
    </div>
}