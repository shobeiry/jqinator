<?php
list($page, $search, $perpage, $order_column, $order_direction) = [$_GET['page'], $_GET['search'], $_GET['perpage'], $_GET['order']['column'], $_GET['order']['direction']];

$data = json_decode(file_get_contents("data.json"));
$offset = ($page - 1) * $perpage;
$total = count($data);
$data = array_slice($data, $offset, $perpage);

print_r(json_encode([
    'data' => $data,
    'meta' => [
        'total' => $total
    ]
]));