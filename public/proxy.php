<?php
/**
 * StealthBrowser Server-Side Proxy v3.0
 * 
 * Features:
 *   - Routes ALL page traffic through your residential proxy
 *   - Test single proxy connection
 *   - Bulk test multiple proxies  
 *   - Test user agent forwarding
 *   - Supports HTTP, HTTPS, SOCKS4, SOCKS5 proxy types
 *   - IP geolocation lookup
 *   - Proper CORS for webapp integration
 * 
 * Upload to: public_html/proxy.php
 */

error_reporting(0);
ini_set('display_errors', 0);
set_time_limit(120);

// CORS headers — MUST be on every response
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With, Authorization');
header('Access-Control-Max-Age: 86400');
header_remove('X-Frame-Options');
header_remove('Content-Security-Policy');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Helper: detect proxy type from string
function getProxyType($type) {
    switch (strtolower(trim($type))) {
        case 'socks5': return CURLPROXY_SOCKS5;
        case 'socks4': return CURLPROXY_SOCKS4;
        case 'socks5h': return defined('CURLPROXY_SOCKS5_HOSTNAME') ? CURLPROXY_SOCKS5_HOSTNAME : CURLPROXY_SOCKS5;
        case 'https': return CURLPROXY_HTTPS;
        default: return CURLPROXY_HTTP;
    }
}

// Helper: get IP geolocation (free API, no key needed)
function getIPGeo($ip) {
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => 'http://ip-api.com/json/' . urlencode($ip) . '?fields=status,country,countryCode,city,zip,lat,lon,timezone,isp,org,as,query',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 5,
        CURLOPT_CONNECTTIMEOUT => 3,
        CURLOPT_SSL_VERIFYPEER => false,
    ]);
    $result = curl_exec($ch);
    curl_close($ch);
    if ($result) {
        $data = json_decode($result, true);
        if ($data && isset($data['status']) && $data['status'] === 'success') {
            return $data;
        }
    }
    return [];
}

// Helper: test a single proxy connection
function testSingleProxy($ph, $pp, $pu, $ppw, $type) {
    $ch = curl_init();
    $opts = [
        CURLOPT_URL => 'https://api.ipify.org?format=json',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_PROXY => $ph,
        CURLOPT_PROXYPORT => intval($pp),
        CURLOPT_PROXYTYPE => getProxyType($type),
    ];
    
    if (!empty($pu) && !empty($ppw)) {
        $opts[CURLOPT_PROXYUSERPWD] = $pu . ':' . $ppw;
        $opts[CURLOPT_PROXYAUTH] = CURLAUTH_BASIC | CURLAUTH_NTLM;
    }
    
    curl_setopt_array($ch, $opts);
    
    $start = microtime(true);
    $result = curl_exec($ch);
    $elapsed = round((microtime(true) - $start) * 1000);
    
    if ($result === false) {
        $err = curl_error($ch);
        $errno = curl_errno($ch);
        curl_close($ch);
        return [
            'success' => false,
            'error' => $err,
            'errno' => $errno,
            'proxy' => $ph . ':' . $pp,
            'latency' => $elapsed . 'ms',
        ];
    }
    
    curl_close($ch);
    
    $data = json_decode($result, true);
    $ip = isset($data['ip']) ? $data['ip'] : trim($result);
    
    // Get geolocation
    $geo = getIPGeo($ip);
    
    return [
        'success' => true,
        'ip' => $ip,
        'proxy' => $ph . ':' . $pp,
        'host' => $ph,
        'port' => $pp,
        'username' => $pu,
        'password' => $ppw,
        'latency' => $elapsed . 'ms',
        'country' => isset($geo['country']) ? $geo['country'] : '',
        'countryCode' => isset($geo['countryCode']) ? $geo['countryCode'] : '',
        'city' => isset($geo['city']) ? $geo['city'] : '',
        'isp' => isset($geo['isp']) ? $geo['isp'] : '',
        'org' => isset($geo['org']) ? $geo['org'] : '',
        'timezone' => isset($geo['timezone']) ? $geo['timezone'] : '',
        'lat' => isset($geo['lat']) ? $geo['lat'] : 0,
        'lon' => isset($geo['lon']) ? $geo['lon'] : 0,
        'type' => 'Residential',
    ];
}

// ==============================
// Route by action parameter
// ==============================
$action = isset($_GET['action']) ? $_GET['action'] : '';

// ===== PING: Check if proxy.php is reachable =====
if ($action === 'ping') {
    header('Content-Type: application/json');
    
    // Also get server's own IP for comparison
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => 'https://api.ipify.org?format=json',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 5,
        CURLOPT_SSL_VERIFYPEER => false,
    ]);
    $srvResult = curl_exec($ch);
    curl_close($ch);
    $srvIP = 'unknown';
    if ($srvResult) {
        $d = json_decode($srvResult, true);
        if (isset($d['ip'])) $srvIP = $d['ip'];
    }
    
    echo json_encode([
        'status' => 'ok',
        'message' => 'StealthBrowser Proxy v3.0 is running',
        'version' => '3.0',
        'php_version' => phpversion(),
        'curl_enabled' => function_exists('curl_init'),
        'server_ip' => $srvIP,
        'timestamp' => date('c'),
    ]);
    exit;
}

// ===== TEST: Test a single proxy and return IP + geo =====
if ($action === 'test') {
    header('Content-Type: application/json');
    
    $ph  = isset($_GET['ph'])  ? $_GET['ph']  : '';
    $pp  = isset($_GET['pp'])  ? $_GET['pp']  : '';
    $pu  = isset($_GET['pu'])  ? $_GET['pu']  : '';
    $ppw = isset($_GET['ppw']) ? $_GET['ppw'] : '';
    $pt  = isset($_GET['pt'])  ? $_GET['pt']  : 'http';
    
    if (empty($ph) || empty($pp)) {
        echo json_encode(['success' => false, 'error' => 'Missing proxy host or port']);
        exit;
    }
    
    $result = testSingleProxy($ph, $pp, $pu, $ppw, $pt);
    echo json_encode($result);
    exit;
}

// ===== TEST_BULK: Test multiple proxies at once =====
if ($action === 'test_bulk') {
    header('Content-Type: application/json');
    
    // Accept POST body with JSON: { "proxies": ["host:port:user:pass", ...], "type": "http" }
    $input = file_get_contents('php://input');
    $payload = json_decode($input, true);
    
    if (!$payload || empty($payload['proxies'])) {
        // Also try GET parameter
        $proxyList = isset($_GET['proxies']) ? $_GET['proxies'] : '';
        if (empty($proxyList)) {
            echo json_encode(['success' => false, 'error' => 'No proxies provided. Send POST JSON with {"proxies":["host:port:user:pass",...]}']);
            exit;
        }
        $payload = ['proxies' => explode("\n", $proxyList), 'type' => isset($_GET['pt']) ? $_GET['pt'] : 'http'];
    }
    
    $type = isset($payload['type']) ? $payload['type'] : 'http';
    $results = [];
    $working = 0;
    $failed = 0;
    
    foreach ($payload['proxies'] as $proxyLine) {
        $proxyLine = trim($proxyLine);
        if (empty($proxyLine)) continue;
        
        // Support formats: host:port:user:pass OR host:port OR user:pass@host:port
        $ph = ''; $pp = ''; $pu = ''; $ppw = '';
        
        if (strpos($proxyLine, '@') !== false) {
            // user:pass@host:port format
            $atParts = explode('@', $proxyLine, 2);
            $authParts = explode(':', $atParts[0], 2);
            $hostParts = explode(':', $atParts[1], 2);
            $pu = $authParts[0];
            $ppw = isset($authParts[1]) ? $authParts[1] : '';
            $ph = $hostParts[0];
            $pp = isset($hostParts[1]) ? $hostParts[1] : '';
        } else {
            // host:port:user:pass format
            $parts = explode(':', $proxyLine);
            $ph = $parts[0];
            $pp = isset($parts[1]) ? $parts[1] : '';
            $pu = isset($parts[2]) ? $parts[2] : '';
            $ppw = isset($parts[3]) ? $parts[3] : '';
        }
        
        if (empty($ph) || empty($pp)) continue;
        
        $result = testSingleProxy($ph, $pp, $pu, $ppw, $type);
        $result['original'] = $proxyLine;
        $results[] = $result;
        
        if ($result['success']) $working++;
        else $failed++;
    }
    
    echo json_encode([
        'success' => true,
        'total' => count($results),
        'working' => $working,
        'failed' => $failed,
        'results' => $results,
    ]);
    exit;
}

// ===== TEST_UA: Verify user agent is sent correctly =====
if ($action === 'test_ua') {
    header('Content-Type: application/json');
    
    $ph  = isset($_GET['ph'])  ? $_GET['ph']  : '';
    $pp  = isset($_GET['pp'])  ? $_GET['pp']  : '';
    $pu  = isset($_GET['pu'])  ? $_GET['pu']  : '';
    $ppw = isset($_GET['ppw']) ? $_GET['ppw'] : '';
    $pt  = isset($_GET['pt'])  ? $_GET['pt']  : 'http';
    $ua  = isset($_GET['ua'])  ? base64_decode($_GET['ua']) : '';
    
    if (empty($ua)) {
        echo json_encode(['success' => false, 'error' => 'No user agent provided (ua parameter, base64 encoded)']);
        exit;
    }
    
    // Use httpbin.org to verify what UA the server sees
    $ch = curl_init();
    $opts = [
        CURLOPT_URL => 'https://httpbin.org/user-agent',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_USERAGENT => $ua,
    ];
    
    // Route through proxy if provided
    if (!empty($ph) && !empty($pp)) {
        $opts[CURLOPT_PROXY] = $ph;
        $opts[CURLOPT_PROXYPORT] = intval($pp);
        $opts[CURLOPT_PROXYTYPE] = getProxyType($pt);
        if (!empty($pu) && !empty($ppw)) {
            $opts[CURLOPT_PROXYUSERPWD] = $pu . ':' . $ppw;
            $opts[CURLOPT_PROXYAUTH] = CURLAUTH_BASIC | CURLAUTH_NTLM;
        }
    }
    
    curl_setopt_array($ch, $opts);
    $result = curl_exec($ch);
    
    if ($result === false) {
        $err = curl_error($ch);
        curl_close($ch);
        echo json_encode(['success' => false, 'error' => 'Could not reach httpbin.org: ' . $err]);
        exit;
    }
    
    curl_close($ch);
    
    $data = json_decode($result, true);
    $receivedUA = isset($data['user-agent']) ? $data['user-agent'] : 'unknown';
    $match = ($ua === $receivedUA);
    
    echo json_encode([
        'success' => true,
        'sent_ua' => $ua,
        'received_ua' => $receivedUA,
        'match' => $match,
        'status' => $match ? 'User agent is correctly forwarded' : 'WARNING: User agent mismatch',
    ]);
    exit;
}

// ===== IP_CHECK: Get server IP without proxy (for comparison) =====
if ($action === 'server_ip') {
    header('Content-Type: application/json');
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => 'https://api.ipify.org?format=json',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_SSL_VERIFYPEER => false,
    ]);
    $result = curl_exec($ch);
    curl_close($ch);
    
    $data = json_decode($result, true);
    $ip = isset($data['ip']) ? $data['ip'] : 'unknown';
    $geo = getIPGeo($ip);
    
    echo json_encode([
        'success' => true,
        'server_ip' => $ip,
        'country' => isset($geo['country']) ? $geo['country'] : '',
        'city' => isset($geo['city']) ? $geo['city'] : '',
        'isp' => isset($geo['isp']) ? $geo['isp'] : '',
    ]);
    exit;
}

// ========================================
// DEFAULT: Proxy a web page
// ========================================
$targetUrl = isset($_GET['url']) ? $_GET['url'] : '';
$proxyHost = isset($_GET['ph'])  ? $_GET['ph']  : '';
$proxyPort = isset($_GET['pp'])  ? $_GET['pp']  : '';
$proxyUser = isset($_GET['pu'])  ? $_GET['pu']  : '';
$proxyPass = isset($_GET['ppw']) ? $_GET['ppw'] : '';
$proxyType = isset($_GET['pt'])  ? $_GET['pt']  : 'http';
$userAgent = isset($_GET['ua'])  ? base64_decode($_GET['ua']) : 
             (isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : 'Mozilla/5.0');

// No URL = show status
if (empty($targetUrl)) {
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'ok',
        'message' => 'StealthBrowser Proxy v3.0',
        'usage' => 'Add ?action=ping to test, ?action=test&ph=HOST&pp=PORT to test proxy, ?url=URL to proxy pages',
    ]);
    exit;
}

if (!filter_var($targetUrl, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Invalid URL: ' . $targetUrl]);
    exit;
}

// Parse URLs for rewriting
$parsed  = parse_url($targetUrl);
$baseScheme = isset($parsed['scheme']) ? $parsed['scheme'] : 'https';
$baseHost   = isset($parsed['host']) ? $parsed['host'] : '';
$baseUrl    = $baseScheme . '://' . $baseHost;

$selfScheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$proxyBase  = $selfScheme . '://' . $_SERVER['HTTP_HOST'] . $_SERVER['SCRIPT_NAME'];

// Proxy params to append to rewritten URLs
$pp = '';
if ($proxyHost)        $pp .= '&ph='  . urlencode($proxyHost);
if ($proxyPort)        $pp .= '&pp='  . urlencode($proxyPort);
if ($proxyUser)        $pp .= '&pu='  . urlencode($proxyUser);
if ($proxyPass)        $pp .= '&ppw=' . urlencode($proxyPass);
if ($proxyType !== 'http') $pp .= '&pt=' . urlencode($proxyType);
if (isset($_GET['ua'])) $pp .= '&ua=' . urlencode($_GET['ua']);

// cURL options
$ch = curl_init();
$opts = [
    CURLOPT_URL            => $targetUrl,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_MAXREDIRS      => 10,
    CURLOPT_TIMEOUT        => 30,
    CURLOPT_CONNECTTIMEOUT => 15,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => false,
    CURLOPT_ENCODING       => '',
    CURLOPT_HEADER         => true,
    CURLOPT_USERAGENT      => $userAgent,
    CURLOPT_HTTPHEADER     => [
        'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language: en-US,en;q=0.9',
        'Cache-Control: no-cache',
        'Pragma: no-cache',
        'Upgrade-Insecure-Requests: 1',
        'Sec-Fetch-Dest: document',
        'Sec-Fetch-Mode: navigate',
        'Sec-Fetch-Site: none',
        'Sec-Fetch-User: ?1',
    ],
];

// Route through residential proxy
if (!empty($proxyHost) && !empty($proxyPort)) {
    $opts[CURLOPT_PROXY]     = $proxyHost;
    $opts[CURLOPT_PROXYPORT] = intval($proxyPort);
    $opts[CURLOPT_PROXYTYPE] = getProxyType($proxyType);
    
    if (!empty($proxyUser) && !empty($proxyPass)) {
        $opts[CURLOPT_PROXYUSERPWD] = $proxyUser . ':' . $proxyPass;
        $opts[CURLOPT_PROXYAUTH]    = CURLAUTH_BASIC | CURLAUTH_NTLM;
    }
}

// Forward POST data
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $opts[CURLOPT_POST] = true;
    $postBody = file_get_contents('php://input');
    if (!empty($postBody)) {
        $opts[CURLOPT_POSTFIELDS] = $postBody;
    } elseif (!empty($_POST)) {
        $opts[CURLOPT_POSTFIELDS] = http_build_query($_POST);
    }
    if (isset($_SERVER['CONTENT_TYPE'])) {
        $opts[CURLOPT_HTTPHEADER][] = 'Content-Type: ' . $_SERVER['CONTENT_TYPE'];
    }
}

// Forward cookies
if (!empty($_COOKIE)) {
    $cookieParts = [];
    foreach ($_COOKIE as $k => $v) {
        if ($k !== 'PHPSESSID') {
            $cookieParts[] = $k . '=' . $v;
        }
    }
    if (!empty($cookieParts)) {
        $opts[CURLOPT_COOKIE] = implode('; ', $cookieParts);
    }
}

$opts[CURLOPT_REFERER] = $targetUrl;

curl_setopt_array($ch, $opts);
$response = curl_exec($ch);

if ($response === false) {
    $error = curl_error($ch);
    $errno = curl_errno($ch);
    curl_close($ch);
    
    http_response_code(502);
    header('Content-Type: text/html');
    echo '<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width"><style>
        body{background:#0a0a0a;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px}
        .box{text-align:center;padding:32px;border:1px solid #333;border-radius:16px;max-width:480px;width:100%}
        h2{color:#f87171;margin:0 0 8px}
        p{color:#888;font-size:13px;line-height:1.5;margin:6px 0}
        code{background:#1a1a1a;padding:2px 8px;border-radius:4px;color:#fbbf24;font-size:11px}
        .tips{text-align:left;margin-top:20px;padding:16px;background:#111;border-radius:8px;border:1px solid #222}
        .tips h4{color:#fbbf24;font-size:12px;margin:0 0 8px}
        .tips li{color:#888;font-size:11px;margin:4px 0;line-height:1.4}
    </style></head><body><div class="box">
        <h2>⚠️ Connection Failed</h2>
        <p>Error ' . $errno . ': <code>' . htmlspecialchars($error) . '</code></p>
        <p>Proxy: <code>' . htmlspecialchars($proxyHost) . ':' . htmlspecialchars($proxyPort) . '</code></p>
        <p>Target: <code>' . htmlspecialchars($targetUrl) . '</code></p>
        <div class="tips">
            <h4>💡 Troubleshooting:</h4>
            <ul>
                <li>Check proxy host and port are correct</li>
                <li>Verify proxy username and password</li>
                <li>Try changing proxy type (HTTP/SOCKS5)</li>
                <li>Make sure proxy is not expired</li>
                <li>Check if proxy provider requires IP whitelisting</li>
                <li>Error 7 = Cannot connect (wrong host/port)</li>
                <li>Error 56 = Proxy rejected connection (wrong auth)</li>
            </ul>
        </div>
    </div></body></html>';
    exit;
}

$headerSize  = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$httpCode    = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE) ?: 'text/html';
curl_close($ch);

$responseHeaders = substr($response, 0, $headerSize);
$body = substr($response, $headerSize);

http_response_code($httpCode);

// Forward Set-Cookie headers
foreach (explode("\r\n", $responseHeaders) as $headerLine) {
    if (stripos($headerLine, 'set-cookie:') === 0) {
        header($headerLine, false);
    }
}

if ($contentType) {
    header('Content-Type: ' . $contentType);
}

// ===== HTML REWRITING =====
if (strpos($contentType, 'text/html') !== false) {
    // Remove base tags
    $body = preg_replace('/<base[^>]*>/i', '', $body);
    
    // URL rewriter function
    $rewrite = function($url) use ($proxyBase, $pp, $baseUrl) {
        if (empty($url) || preg_match('/^(data:|javascript:|mailto:|blob:|#|about:)/', $url)) return $url;
        if (strpos($url, $proxyBase) === 0) return $url;
        if (strpos($url, '//') === 0) $url = 'https:' . $url;
        elseif (strpos($url, '/') === 0) $url = $baseUrl . $url;
        elseif (strpos($url, 'http') !== 0) $url = $baseUrl . '/' . $url;
        return $proxyBase . '?url=' . urlencode($url) . $pp;
    };
    
    // Rewrite src, href, action attributes
    $body = preg_replace_callback(
        '/(src|href|action)\s*=\s*["\']([^"\']+)["\']/i',
        function($m) use ($rewrite) {
            $url = $m[2];
            if (strpos($url, '#') === 0) return $m[0];
            return $m[1] . '="' . $rewrite($url) . '"';
        },
        $body
    );
    
    // Rewrite CSS url() 
    $body = preg_replace_callback(
        '/url\(\s*["\']?([^"\')\\s]+)["\']?\s*\)/i',
        function($m) use ($rewrite) {
            if (strpos($m[1], 'data:') === 0) return $m[0];
            return 'url("' . $rewrite($m[1]) . '")';
        },
        $body
    );
    
    // Inject JS interceptor
    $js = '<script>(function(){
var P=' . json_encode($proxyBase) . ',PP=' . json_encode($pp) . ',B=' . json_encode($baseUrl) . ';
function R(u){if(!u||/^(data:|javascript:|blob:|#|about:)/.test(u))return u;if(u.indexOf(P)===0)return u;
if(u.indexOf("//")===0)u="https:"+u;else if(u.indexOf("/")===0)u=B+u;else if(u.indexOf("http")!==0)u=B+"/"+u;
return P+"?url="+encodeURIComponent(u)+PP}
var F=window.fetch;window.fetch=function(a,b){if(typeof a==="string")a=R(a);return F.call(this,a,b)};
var X=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(m,u){arguments[1]=R(u);return X.apply(this,arguments)};
var W=window.open;window.open=function(u){if(u)arguments[0]=R(u);return W.apply(this,arguments)};
document.addEventListener("click",function(e){var a=e.target.closest("a[href]");if(a){var h=a.getAttribute("href");
if(h&&!/^(#|javascript:)/.test(h)&&h.indexOf(P)!==0){e.preventDefault();window.location.href=R(h)}}},true);
document.addEventListener("submit",function(e){var f=e.target;if(f.tagName==="FORM"&&f.action&&f.action.indexOf(P)!==0)f.action=R(f.action)},true);
try{if(window.parent!==window)window.parent.postMessage({type:"stealth_url_change",url:' . json_encode($targetUrl) . '},"*")}catch(e){}
})();</script>';
    
    if (stripos($body, '</head>') !== false) {
        $body = str_ireplace('</head>', $js . '</head>', $body);
    } elseif (stripos($body, '<body') !== false) {
        $body = preg_replace('/(<body[^>]*>)/i', '$1' . $js, $body, 1);
    } else {
        $body = $js . $body;
    }
    
    echo $body;
    
} elseif (strpos($contentType, 'text/css') !== false) {
    // Rewrite CSS url() references
    $body = preg_replace_callback(
        '/url\(\s*["\']?([^"\')\\s]+)["\']?\s*\)/i',
        function($m) use ($proxyBase, $pp, $baseUrl) {
            $url = $m[1];
            if (strpos($url, 'data:') === 0) return $m[0];
            if (strpos($url, '//') === 0) $url = 'https:' . $url;
            elseif (strpos($url, '/') === 0) $url = $baseUrl . $url;
            elseif (strpos($url, 'http') !== 0) $url = $baseUrl . '/' . $url;
            return 'url("' . $proxyBase . '?url=' . urlencode($url) . $pp . '")';
        },
        $body
    );
    echo $body;
} else {
    // Binary/other content — pass through as-is
    echo $body;
}
?>
