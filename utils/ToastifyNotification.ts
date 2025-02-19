import { Bounce, ToastContainer, toast } from "react-toastify";

const notifyError = (error: string) =>
  toast.error(error, {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: false,
    pauseOnHover: true,
    draggable: true,
    theme: "light",
    transition: Bounce,
  });

const notifySuccess = (data: string) =>
  toast.success(data, {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: false,
    pauseOnHover: true,
    draggable: true,
    theme: "light",
    transition: Bounce,
  });

export { notifySuccess, notifyError, ToastContainer };
