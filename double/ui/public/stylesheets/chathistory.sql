create table ChatHistory
(
    Time     datetime      not null comment '时间',
    name     varchar(255)  not null comment '发送者名称',
    toname   varchar(255)  not null comment '发送者名称',
    message  MediumBlob    not null comment '消息',
    type     varchar(10)   not null comment '消息类型'
)
comment '聊天记录';