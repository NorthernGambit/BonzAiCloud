export const overlapCheck = (aStart, aEnd, bStart, bEnd) => {
	return aStart < bEnd && bStart < aEnd;
};
