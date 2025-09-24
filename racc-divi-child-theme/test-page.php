<!DOCTYPE html>
<html>
<head>
    <title>RACC Test Page</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .debug-box { background: red; color: white; padding: 20px; margin: 10px; font-size: 18px; }
    </style>
</head>
<body>
    <div class="debug-box">
        SIMPLE TEST: If you can see this, basic HTML is working.
        This is a standalone test file.
    </div>
    
    <h1>RACC Child Theme Test</h1>
    <p>This is a simple test to see if our files are being loaded properly.</p>
    
    <?php
    // Test if we're in WordPress
    if (function_exists('wp_get_theme')) {
        echo '<div class="debug-box">WordPress functions are available</div>';
        $theme = wp_get_theme();
        echo '<div class="debug-box">Active theme: ' . $theme->get('Name') . '</div>';
    } else {
        echo '<div class="debug-box">WordPress functions NOT available</div>';
    }
    
    // Test if Divi is active
    if (function_exists('et_setup_theme')) {
        echo '<div class="debug-box">Divi theme functions detected</div>';
    } else {
        echo '<div class="debug-box">Divi theme functions NOT detected</div>';
    }
    ?>
    
    <div class="debug-box">
        Current file: <?php echo __FILE__; ?>
    </div>
</body>
</html>