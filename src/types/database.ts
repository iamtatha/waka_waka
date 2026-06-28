export interface Profile {
    id: string;
    display_name: string;
    email: string;
    total_points: number;
    role?: 'owner' | 'admin' | null;
    is_disabled?: boolean;
    bracket_picks?: Record<string, string> | null;
}

export interface Match {
    id: string;
    team_a: string;
    team_b: string;
    kickoff: string;
    venue: string;
    score_a: number | null;
    score_b: number | null;
    status: 'upcoming' | 'live' | 'finished';
    match_number?: number | null;
    stage?: string | null;
    home_dependency?: number | null;
    away_dependency?: number | null;
    penalty_winner?: 'team_a' | 'team_b' | null;
}

export interface Prediction {
    id: string;
    user_id: string;
    match_id: string;
    pred_a: number;
    pred_b: number;
    points: number;
}
