import { createContext, useContext } from 'react';
import { useSocket } from './SocketContext';
import { useDirectCall } from '../hooks/useDirectCall';
import CallOverlay from '../components/CallOverlay/CallOverlay';

const CallContext = createContext(null);

// Calls are app-wide, not page-wide: an incoming call has to ring whether the student is
// on the feed, in a course, or already on Messages. Mounting the overlay here means the
// ringing UI survives navigation instead of unmounting with the chat page.
export const CallProvider = ({ children }) => {
  const { socket } = useSocket();
  const call = useDirectCall(socket);

  return (
    <CallContext.Provider value={call}>
      {children}
      <CallOverlay {...call} />
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);
