import { Card, CardContent, Typography, Box, Stack, Chip, LinearProgress, alpha } from '@mui/material';

const KPICard = ({
    title,
    value,
    subtitle,
    icon,
    color = '#D9A441',
    trend,
    progress,
    onClick
}) => {
    return (
        <Card
            sx={{
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                cursor: onClick ? 'pointer' : 'default',
                '&:hover': onClick ? {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                    '& .icon-container': {
                        transform: 'scale(1.1) rotate(5deg)',
                    }
                } : {},
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.5)})`,
                }
            }}
            onClick={onClick}
        >
            <CardContent sx={{ p: 3 }}>
                <Stack spacing={2}>
                    <Box display="flex" alignItems="flex-start" justifyContent="space-between">
                        <Box flex={1}>
                            <Typography color="text.secondary" variant="body2" fontWeight={500} gutterBottom>
                                {title}
                            </Typography>
                            <Typography variant="h3" fontWeight="bold" sx={{ my: 1 }}>
                                {value}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {subtitle}
                            </Typography>
                        </Box>
                        <Box
                            className="icon-container"
                            sx={{
                                color: color,
                                transition: 'transform 0.3s ease',
                            }}
                        >
                            {icon}
                        </Box>
                    </Box>

                    {trend && (
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Chip
                                label={trend}
                                size="small"
                                sx={{
                                    backgroundColor: alpha(color, 0.15),
                                    color: color,
                                    fontWeight: 600,
                                }}
                            />
                        </Box>
                    )}

                    {progress !== undefined && (
                        <Box>
                            <LinearProgress
                                variant="determinate"
                                value={progress}
                                sx={{
                                    height: 6,
                                    borderRadius: 3,
                                    backgroundColor: alpha(color, 0.1),
                                    '& .MuiLinearProgress-bar': {
                                        borderRadius: 3,
                                        backgroundColor: color,
                                    }
                                }}
                            />
                        </Box>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
};

export default KPICard;
