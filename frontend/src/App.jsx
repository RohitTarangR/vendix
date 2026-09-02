import { BrowserRouter } from 'react-router-dom';
import { ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import UiOverlay from './components/common/UiOverlay';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <BrowserRouter>
      <ToastContainer 
        position="top-center" 
        autoClose={1500} 
        hideProgressBar 
        theme="light" 
        transition={Slide} 
        toastClassName="!rounded-xl !shadow-lg !font-sans !border !border-slate-100 !mb-2"
        bodyClassName="!font-sans !text-sm !font-medium !text-slate-700 dark:text-gray-300 !p-1"
      />
      <UiOverlay />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
