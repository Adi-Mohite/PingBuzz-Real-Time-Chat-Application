
const NoChatSelected = () => {
  return (
    <div className="w-full flex flex-1 flex-col items-center justify-center p-16 bg-base-100/50">
        <div className="max-w-md text-center space-y-6">
            {/* Icon Display */}
            <div className="flex justify-center  gap-4 mb-2">
                <div className="relative">
                    <div className=" rounded-4xl flex items-center justify-center animate-bounce">
                        <img src='/PingBuzzLogo.png' className='w-60 h-55 text-primary' />
                    </div>
                </div>
            </div>

            {/* welcome Text */}
            <h2 className='text-4xl font-bold m-0'>Welcome To Ping<span className='text-yellow-500 m-0'>Buzz</span></h2>
            <p className='text-slate-400'>
                Where Moments Turn Into Messages.
            </p>
        </div>
    </div>
  );
};

export default NoChatSelected