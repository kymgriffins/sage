-- Fix Inner Circle Trader Videos by Importing Real YouTube Data
-- Run this SQL script in your Neon database via SQL editor or command line

-- Step 1: Update channel ID to use REAL YouTube channel ID
-- (Assuming you have a channel record with the fake ID)
UPDATE channels
SET "youtubeChannelId" = 'UCtjxa77NqamhVC8atV85Rog',
    "channelTitle" = 'The Inner Circle Trader',
    "subscriberCount" = 1930000,
    "videoCount" = 779,
    "viewCount" = 170439226,
    "description" = 'I am the Mentor of your Mentor. Author & Creator of "Smart Money Concepts"',
    "lastUpdated" = NOW()
WHERE "youtubeChannelId" = 'UCCvAyFxccccqXJ6rxe-l6EA'
OR "channelTitle" LIKE '%Inner Circle Trader%';

-- Step 2: Delete any existing test videos for this channel
DELETE FROM streams
WHERE "channelId" IN (
    SELECT id FROM channels WHERE "youtubeChannelId" = 'UCtjxa77NqamhVC8atV85Rog'
)
AND ("title" LIKE 'Test%' OR "title" LIKE 'Demo%' OR "youtubeId" = '');

-- Step 3: Insert the real YouTube videos
-- (Edit the VALUES for your channel ID from the query above)
INSERT INTO streams (
    "youtubeId", "title", "description", "youtubeUrl",
    "channelId", "isLive", "createdAt", "updatedAt"
) VALUES
    ('043OW8trIJE', 'ICT PD Array Matrix Revealed  \\ October 18, 2025', 'Government Required Risk Disclaimer...', 'https://www.youtube.com/watch?v=043OW8trIJE', (SELECT id FROM channels WHERE "youtubeChannelId" = 'UCtjxa77NqamhVC8atV85Rog'), true, '2025-10-18T20:10:42Z', NOW()),
    ('g9BctYx0LaI', 'ICT Forex & Futures Market Review \\ October 15, 2025', 'Government Required Risk Disclaimer...', 'https://www.youtube.com/watch?v=g9BctYx0LaI', (SELECT id FROM channels WHERE "youtubeChannelId" = 'UCtjxa77NqamhVC8atV85Rog'), false, '2025-10-15T18:44:16Z', NOW()),
    ('p9w1Nc6FK0c', 'ICT Secret To Selecting Algorithmic PD Arrays \\ October 14, 2025', 'Government Required Risk Disclaimer...', 'https://www.youtube.com/watch?v=p9w1Nc6FK0c', (SELECT id FROM channels WHERE "youtubeChannelId" = 'UCtjxa77NqamhVC8atV85Rog'), true, '2025-10-14T18:19:44Z', NOW()),
    ('C_0Jh7HwCUI', 'Advanced ICT Liquidity Concepts \\ October 11, 2025', 'Government Required Risk Disclaimer...', 'https://www.youtube.com/watch?v=C_0Jh7HwCUI', (SELECT id FROM channels WHERE "youtubeChannelId" = 'UCtjxa77NqamhVC8atV85Rog'), false, '2025-10-11T18:54:04Z', NOW()),
    ('rxot6S73Lvs', 'ICT Forex & Futures Market Review October 3, 2025', 'Government Required Risk Disclaimer...', 'https://www.youtube.com/watch?v=rxot6S73Lvs', (SELECT id FROM channels WHERE "youtubeChannelId" = 'UCtjxa77NqamhVC8atV85Rog'), false, '2025-10-03T14:51:44Z', NOW()),
    ('N4gTPOnZIYw', 'ICT NQ Futures Market Review \\ October 1, 2025', 'Government Required Risk Disclaimer...', 'https://www.youtube.com/watch?v=N4gTPOnZIYw', (SELECT id FROM channels WHERE "youtubeChannelId" = 'UCtjxa77NqamhVC8atV85Rog'), true, '2025-10-01T22:38:01Z', NOW()),
    ('K4KFcDiXD5M', 'Focus On Forex & Index Futures September 29, 2025', 'Government Required Risk Disclaimer...', 'https://www.youtube.com/watch?v=K4KFcDiXD5M', (SELECT id FROM channels WHERE "youtubeChannelId" = 'UCtjxa77NqamhVC8atV85Rog'), false, '2025-09-29T19:37:17Z', NOW()),
    ('-g7vnzaRDv4', 'Focus On Index Futures September 25, 2025', 'Government Required Risk Disclaimer...', 'https://www.youtube.com/watch?v=-g7vnzaRDv4', (SELECT id FROM channels WHERE "youtubeChannelId" = 'UCtjxa77NqamhVC8atV85Rog'), false, '2025-09-25T23:02:35Z', NOW()),
    ('tNL_BtccMfA', 'Focus On Forex DXY EurUsd GbpUsd 09/25/2025', 'Government Required Risk Disclaimer...', 'https://www.youtube.com/watch?v=tNL_BtccMfA', (SELECT id FROM channels WHERE "youtubeChannelId" = 'UCtjxa77NqamhVC8atV85Rog'), false, '2025-09-25T22:32:05Z', NOW()),
    ('8DWi2wLWv30', 'Focus On Index Futures September 24, 2025 \\ Intermediate Term High Continued', 'Government Required Risk Disclaimer...', 'https://www.youtube.com/watch?v=8DWi2wLWv30', (SELECT id FROM channels WHERE "youtubeChannelId" = 'UCtjxa77NqamhVC8atV85Rog'), false, '2025-09-24T22:55:57Z', NOW()),
    ('SoBjcbxvDM8', 'Cooking breakfast and NQ...', '', 'https://www.youtube.com/watch?v=SoBjcbxvDM8', (SELECT id FROM channels WHERE "youtubeChannelId" = 'UCtjxa77NqamhVC8atV85Rog'), false, '2025-09-18T13:13:48Z', NOW()),
    ('dA2CHAN1DzY', 'Trading Premarket and Regular Session Liquidity', 'Government Required Risk Disclaimer...', 'https://www.youtube.com/watch?v=dA2CHAN1DzY', (SELECT id FROM channels WHERE "youtubeChannelId" = 'UCtjxa77NqamhVC8atV85Rog'), false, '2025-09-18T22:52:56Z', NOW()),
    ('ixKzHykP0CY', '2025 Storytellers Series - Daily High To Low June 21, 2025', 'Government Required Risk Disclaimer...', 'https://www.youtube.com/watch?v=ixKzHykP0CY', (SELECT id FROM channels WHERE "youtubeChannelId" = 'UCtjxa77NqamhVC8atV85Rog'), false, '2025-06-21T19:58:50Z', NOW()),
    ('L6DHi1iXRW0', '2025 Lecture Series - Keys To Success In Troubled Markets June 16, 2025', 'Government Required Risk Disclaimer...', 'https://www.youtube.com/watch?v=L6DHi1iXRW0', (SELECT id FROM channels WHERE "youtubeChannelId" = 'UCtjxa77NqamhVC8atV85Rog'), false, '2025-06-16T12:35:45Z', NOW()),
    ('fjvD0HFoN9o', 'Chatting With TBM and trading Spooz...', '', 'https://www.youtube.com/watch?v=fjvD0HFoN9o', (SELECT id FROM channels WHERE "youtubeChannelId" = 'UCtjxa77NqamhVC8atV85Rog'), false, '2025-06-11T14:38:34Z', NOW())
ON CONFLICT ("youtubeId") DO NOTHING;

-- Verify: Check how many videos we now have for Inner Circle Trader
SELECT COUNT(*) as total_real_videos FROM streams s
JOIN channels c ON s."channelId" = c.id
WHERE c."youtubeChannelId" = 'UCtjxa77NqamhVC8atV85Rog';

-- Check: List all Inner Circle Trader videos in database
SELECT s."youtubeId", s."title", s."isLive", s."createdAt"::text
FROM streams s
JOIN channels c ON s."channelId" = c.id
WHERE c."youtubeChannelId" = 'UCtjxa77NqamhVC8atV85Rog'
ORDER BY s."createdAt" DESC;
