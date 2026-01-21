import { startOfWeek, addDays, format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';

// Helper to get Monday of the week for a given date
export const getMonday = (date) => {
    return startOfWeek(date, { weekStartsOn: 1 });
};

export const getFriday = (mondayDate) => {
    return addDays(mondayDate, 4);
};

export const formatDateJP = (date) => {
    return format(date, 'yyyy年MM月dd日', { locale: ja });
};

// Returns an array of 5 dates (Mon-Fri) starting from the given Monday
export const getWeekDays = (mondayDate) => {
    const days = [];
    for (let i = 0; i < 5; i++) {
        days.push(addDays(mondayDate, i));
    }
    return days;
};
