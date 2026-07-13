-- SQL Queries to fetch separated logs for a specific member

-- 1. FETCH ATTENDANCE LOGS ONLY
SELECT 
    al.id,
    al.record_id AS member_id,
    al.action,
    al.new_values->>'description' AS description,
    p.full_name AS performed_by_name,
    al.timestamp
FROM 
    public.activity_logs al
LEFT JOIN 
    public.profiles p ON al.performed_by = p.id
WHERE 
    al.record_id = 'YOUR_MEMBER_ID_HERE' -- Replace with specific member ID
    AND (
        al.table_name = 'attendance'
        OR al.new_values->>'description' ILIKE '%present%'
        OR al.new_values->>'description' ILIKE '%absent%'
        OR al.new_values->>'description' ILIKE '%attendance%'
    )
ORDER BY 
    al.timestamp DESC;


-- 2. FETCH PLAN & PROFILE UPDATE LOGS ONLY (Excludes Attendance)
SELECT 
    al.id,
    al.table_name,
    al.record_id AS member_id,
    al.action,
    al.new_values->>'description' AS description,
    p.full_name AS performed_by_name,
    al.timestamp
FROM 
    public.activity_logs al
LEFT JOIN 
    public.profiles p ON al.performed_by = p.id
WHERE 
    al.record_id = 'YOUR_MEMBER_ID_HERE' -- Replace with specific member ID
    AND NOT (
        al.table_name = 'attendance'
        OR al.new_values->>'description' ILIKE '%present%'
        OR al.new_values->>'description' ILIKE '%absent%'
        OR al.new_values->>'description' ILIKE '%attendance%'
    )
ORDER BY 
    al.timestamp DESC;
