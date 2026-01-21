import React, { useRef, useEffect } from 'react';
import { formatDateJP } from '../utils/dateUtils';

const DailyEntry = ({
    date,
    data,
    onUpdate,
    canMergePrevious,
    isMergedWithPrevious,
    nextDayIsMerged
}) => {
    const [showMenu, setShowMenu] = React.useState(false);
    const [menuPos, setMenuPos] = React.useState({ x: 0, y: 0 });
    const textareaRef = useRef(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [data.content]);

    if (isMergedWithPrevious) {
        return null; // Don't render if merged into previous
    }

    const handleDateClick = (e) => {
        e.preventDefault();
        setMenuPos({ x: e.clientX, y: e.clientY });
        setShowMenu(true);
    };

    const handleMenuSelect = (action) => {
        setShowMenu(false);
        onUpdate({ ...data, ...action });
    };

    // Determine pill style
    const isFilled = data.content && data.content.trim().length > 0;
    const isOrange = isFilled || data.isHoliday === false;
    // Requirement: "Inputting (entered) days have orange background. Default is gray."
    // Also "Holiday... background remains gray".
    // So: Holiday -> Gray. Workday with content -> Orange? 
    // "Initial value is gray". "BackgroundColor becomes orange while inputting/entered".
    // Let's rely on content existence for orange, unless specific logic applies.
    // Actually, let's keep it simple: If has content AND not holiday -> Orange. 

    const pillClass = (data.content?.length > 0 && !data.isHoliday) ? 'orange' : 'gray';

    // Label construction
    let dateLabel = formatDateJP(date);
    if (nextDayIsMerged) {
        // We need to know HOW MANY days are merged. 
        // This simple prop might not be enough if we support multi-day merge chains (Mon-Wed).
        // Parent should pass the "End Date" of this block if it spans.
    }

    // For now, let's assume the parent handles the "Label" calculation if it's complicated,
    // or we pass a "dateLabelOverride" prop.

    return (
        <div className="daily-entry-wrapper">
            <div
                className={`date-pill ${pillClass}`}
                onClick={handleDateClick}
            >
                {/* We'll use a prop for the label to handle ranges cleanly */}
                {data.customLabel || formatDateJP(date)}
            </div>

            {data.isHoliday && <span className="holiday-label">祝日</span>}

            {!data.isHoliday && (
                <textarea
                    ref={textareaRef}
                    className="entry-textarea"
                    placeholder=""
                    value={data.content || ''}
                    onChange={(e) => onUpdate({ ...data, content: e.target.value })}
                    rows={2}
                />
            )}

            {showMenu && (
                <>
                    <div
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }}
                        onClick={() => setShowMenu(false)}
                    />
                    <div className="popover-menu" style={{ top: menuPos.y, left: menuPos.x }}>
                        <div className="popover-item" onClick={() => handleMenuSelect({ isHoliday: false })}>
                            就業日 (通常)
                        </div>
                        <div className="popover-item" onClick={() => handleMenuSelect({ isHoliday: true, content: '' })}>
                            祝祭日
                        </div>
                        {canMergePrevious && (
                            <div className="popover-item" onClick={() => handleMenuSelect({ mergeWithPrevious: true })}>
                                前日と同じ
                            </div>
                        )}
                        {/* Logic to UN-merge? "Change to Workday" implies unmerge if currently merged? 
                    Actually "Same as previous" is triggered from the SECOND day. 
                    So if I am Mon, I can't merge previous.
                    If I am Tue, and I click Tue, I can "Same as previous".
                    If I am Tue and ALREADY merged, I am hidden! I can't click! 
                    
                    Wait, if I merge Tue into Mon, Tue DISAPPEARS. How do I undo it?
                    The requirement says: "Inputted daily report can be changed anytime later".
                    "If Click Tuesday... 'Same as previous'... dates integrate".
                    If integrated, "2025/12/22 ~ 2025/12/23" appears on the merged block.
                    Does clicking THAT block allow un-merging? 
                    Yes, likely.
                    So if I click the Merged Block, I should see "Split" or "Reset"?
                    Or simply, if I act on the Mon-Tue block, are we acting on Mon or Tue?
                    Users might want to unmerge Tue. 
                    I should add an "Unmerge last day" option if the current block spans multiple days.
                 */}
                        {daySpansMultiple(data) && (
                            <div className="popover-item" onClick={() => handleMenuSelect({ unmergeLast: true })}>
                                解除 (最終日を分離)
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

// Helper utility for checking if data spans
function daySpansMultiple(data) {
    return data.span > 1;
}

export default DailyEntry;
