import React from 'react'
import Sidebar from '../component/Sidebar';
import NoChatSelected from '../component/NoChatSelected';
import ChatContainer from '../component/ChatContainer';
import { useChatStore } from '../store/useChatStore';


const HomePage = () => {
  const {selectedUser} = useChatStore();
  return (
    <div className='pt-16 h-[calc(100vh-4rem)] w-screen bg-base-200'>
          <div className="flex h-full w-full">
            <Sidebar/>
            {!selectedUser ? <NoChatSelected /> : <ChatContainer/>}
          </div>
        </div>
  )
}

export default HomePage