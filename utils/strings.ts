export const validateEmail = (value: string) => {
    const emailPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return emailPattern.test(value);
};

export const capitalize = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

export const createInitials = (nameFirst: string, nameLast: string) => {
    return nameFirst.charAt(0).toUpperCase() + nameLast.charAt(0).toUpperCase();
};

export const truncate = (str: string, n: number) => {
    return str.length > n ? str.slice(0, n - 1) + "...." : str;
};

export const formatUnixTimestampToTimeDateString = (timestamp: number) => {
    const date = new Date(timestamp * 1000);

    const time = date
        .toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        })
        .toLowerCase();

    const formattedDate = date.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
    });

    return `${time} @ ${formattedDate}`;
};
