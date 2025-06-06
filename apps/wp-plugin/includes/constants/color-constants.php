<?php
/**
 * Team556 Pay Color Constants
 *
 * Defines PHP constants for colors based on packages/ui/constants/Colors.ts
 * These constants are used to maintain consistency and adhere to the rule
 * of not hardcoding colors in the WordPress plugin.
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Based on DefaultColors from packages/ui/constants/Colors.ts
define('TEAM556_PAY_PRIMARY', '#AE6CFE');
define('TEAM556_PAY_SECONDARY', '#14F195');
define('TEAM556_PAY_ERROR', '#ff5252');
define('TEAM556_PAY_SUCCESS', '#4caf50');
define('TEAM556_PAY_TEXT', '#ECEDEE');
define('TEAM556_PAY_TEXT_SECONDARY', '#9BA1A6');
define('TEAM556_PAY_TEXT_TERTIARY', '#657786');
define('TEAM556_PAY_BACKGROUND_LIGHT', '#373B47');
define('TEAM556_PAY_BACKGROUND', '#23242A');
define('TEAM556_PAY_BACKGROUND_DARK', '#1a1a1a');
define('TEAM556_PAY_BACKGROUND_DARKER', '#121212');
define('TEAM556_PAY_BACKGROUND_DARKEST', '#0d0d0d');
define('TEAM556_PAY_ERROR_BACKGROUND', '#FFCDD2');
define('TEAM556_PAY_ERROR_TEXT', '#D32F2F');
define('TEAM556_PAY_BACKGROUND_CARD', '#1E2024');
define('TEAM556_PAY_BACKGROUND_SUBTLE', 'rgba(255, 255, 255, 0.05)');
define('TEAM556_PAY_PRIMARY_SUBTLE', 'rgba(153, 69, 255, 0.1)');
define('TEAM556_PAY_PRIMARY_SUBTLE_DARK', 'rgba(153, 69, 255, 0.2)');
define('TEAM556_PAY_SECONDARY_SUBTLE', 'rgba(20, 241, 149, 0.1)');
define('TEAM556_PAY_CARD_BACKGROUND', 'rgba(22, 25, 30, 0.8)');
define('TEAM556_PAY_CARD_BACKGROUND_SUBTLE', 'rgba(22, 25, 30, 0.5)');
define('TEAM556_PAY_BLACK', '#000');
define('TEAM556_PAY_TINT', '#AE6CFE'); // Same as PRIMARY
define('TEAM556_PAY_ICON', '#9BA1A6'); // Same as TEXT_SECONDARY
define('TEAM556_PAY_TAB_ICON_DEFAULT', '#9BA1A6'); // Same as TEXT_SECONDARY
define('TEAM556_PAY_TAB_ICON_SELECTED', '#fff');
