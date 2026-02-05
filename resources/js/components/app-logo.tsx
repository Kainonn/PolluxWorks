export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-md">
                <img src="/logo.png" alt="PolluxWorks" className="size-8 object-contain" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
                    PolluxWorks
                </span>
            </div>
        </>
    );
}
