# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: storefront-pricing-stock.spec.js >> storefront pricing and stock flow >> keeps pricing and stock consistent from product to order history
- Location: e2e\storefront-pricing-stock.spec.js:21:3

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('body')
Timeout: 15000ms
- Expected substring  - 1
+ Received string     + 6

- Travertine
+
+     0982 818 273Thiendongvnit@gmail.com52 Ấp Đồng Chinh, Xã Phước Hoà, Huyện Phú Giáo, Tỉnh Bình DươngTHIÊN ĐỒNGVIỆT NAMTrang chủGiới thiệuVề Chúng TôiLịch Sử Phát TriểnTầm Nhìn & Sứ MệnhGiá Trị Cốt LõiBan Lãnh ĐạoSơ Đồ Tổ ChứcSản phẩmTất cả sản phẩmDự ánTin tứcLiên hệ🌐Tiếng ViệtĐăng nhậpTHIÊN ĐỒNGVIỆT NAMTrang chủGiới thiệuVề Chúng TôiLịch Sử Phát TriểnTầm Nhìn & Sứ MệnhGiá Trị Cốt LõiBan Lãnh ĐạoSơ Đồ Tổ ChứcSản phẩmTất cả sản phẩmDự ánTin tứcLiên hệ🇻🇳Tiếng Việt🇺🇸English🇨🇳中文简体0982 818 2730968 297 104Thiendongvnit@gmail.com52 Ấp Đồng Chinh, Xã Phước Hoà, Huyện Phú Giáo, Tỉnh Bình DươngTìm kiếm nhanhĐăng nhậpTHIÊN ĐỒNG VIỆT NAMSản PhẩmKhám phá bộ sưu tập vật liệu nội thất cao cấp của chúng tôiTrang ChủSản PhẩmDANH MỤCDANH MỤCDanh mục sản phẩm0Tất cả sản phẩm0Tất cả —  — 0 sản phẩmKhông tìm thấy sản phẩm phù hợp.THIÊN ĐỒNG VIỆT NAMUY TÍN TỪ NHỮNG ĐIỀU NHỎ NHẤT52 Ấp Đồng ChinhXã Phước HoàHuyện Phú GiáoTỉnh Bình DươngSĐT:0948.929.744E-mail:thiendongintl@gmail.comGiới thiệuTổng Quan Công TyLịch Sử Phát TriểnTầm Nhìn & Sứ MệnhGiá Trị Cốt LõiBan Lãnh ĐạoSơ Đồ Tổ ChứcNăng lựcHình Ảnh Nhà MáyCông Nghệ Sản XuấtChứng Nhận ISO & CESản phẩmDanh Mục Sản PhẩmDự ánDự Án Tiêu BiểuTin tứcTin Tức Mới NhấtLiên hệLiên Hệ Chúng TôiLiên hệBản quyền © THIÊN ĐỒNG VIỆT NAMUY TÍN TỪ NHỮNG ĐIỀU NHỎ NHẤTHỗ trợ kỹ thuật: UY TÍN TỪ NHỮNG ĐIỀU NHỎ NHẤT
+     
+   
+
+

Call log:
  - Expect "toContainText" with timeout 15000ms
  - waiting for locator('body')
    5 × locator resolved to <body data-aos-delay="0" data-aos-duration="800" data-aos-easing="ease-in-out">…</body>
      - unexpected value "
    0982 818 273Thiendongvnit@gmail.com52 Ấp Đồng Chinh, Xã Phước Hoà, Huyện Phú Giáo, Tỉnh Bình DươngTHIÊN ĐỒNGVIỆT NAMTrang chủGiới thiệuVề Chúng TôiLịch Sử Phát TriểnTầm Nhìn & Sứ MệnhGiá Trị Cốt LõiBan Lãnh ĐạoSơ Đồ Tổ ChứcSản phẩmTất cả sản phẩmDự ánTin tứcLiên hệ🌐Tiếng ViệtĐăng nhậpTHIÊN ĐỒNGVIỆT NAMTrang chủGiới thiệuVề Chúng TôiLịch Sử Phát TriểnTầm Nhìn & Sứ MệnhGiá Trị Cốt LõiBan Lãnh ĐạoSơ Đồ Tổ ChứcSản phẩmTất cả sản phẩmDự ánTin tứcLiên hệ🇻🇳Tiếng Việt🇺🇸English🇨🇳中文简体0982 818 2730968 297 104Thiendongvnit@gmail.com52 Ấp Đồng Chinh, Xã Phước Hoà, Huyện Phú Giáo, Tỉnh Bình DươngTìm kiếm nhanhĐăng nhậpTHIÊN ĐỒNG VIỆT NAMSản PhẩmKhám phá bộ sưu tập vật liệu nội thất cao cấp của chúng tôiTrang ChủSản PhẩmDANH MỤCDANH MỤCDanh mục sản phẩm0Tất cả sản phẩm0Tất cả —  — 0 sản phẩmKhông tìm thấy sản phẩm phù hợp.THIÊN ĐỒNG VIỆT NAMUY TÍN TỪ NHỮNG ĐIỀU NHỎ NHẤT52 Ấp Đồng ChinhXã Phước HoàHuyện Phú GiáoTỉnh Bình DươngSĐT:0948.929.744E-mail:thiendongintl@gmail.comGiới thiệuTổng Quan Công TyLịch Sử Phát TriểnTầm Nhìn & Sứ MệnhGiá Trị Cốt LõiBan Lãnh ĐạoSơ Đồ Tổ ChứcNăng lựcHình Ảnh Nhà MáyCông Nghệ Sản XuấtChứng Nhận ISO & CESản phẩmDanh Mục Sản PhẩmDự ánDự Án Tiêu BiểuTin tứcTin Tức Mới NhấtLiên hệLiên Hệ Chúng TôiLiên hệBản quyền © THIÊN ĐỒNG VIỆT NAMUY TÍN TỪ NHỮNG ĐIỀU NHỎ NHẤTHỗ trợ kỹ thuật: UY TÍN TỪ NHỮNG ĐIỀU NHỎ NHẤT
    
  

"
    - locator resolved to <body data-aos-delay="0" data-aos-duration="800" data-aos-easing="ease-in-out">…</body>
    - unexpected value "
    0982 818 273Thiendongvnit@gmail.com52 Ấp Đồng Chinh, Xã Phước Hoà, Huyện Phú Giáo, Tỉnh Bình DươngTHIÊN ĐỒNGVIỆT NAMTrang chủGiới thiệuVề Chúng TôiLịch Sử Phát TriểnTầm Nhìn & Sứ MệnhGiá Trị Cốt LõiBan Lãnh ĐạoSơ Đồ Tổ ChứcSản phẩmTất cả sản phẩmDự ánTin tứcLiên hệ🌐Tiếng ViệtĐăng nhậpTHIÊN ĐỒNGVIỆT NAMTrang chủGiới thiệuVề Chúng TôiLịch Sử Phát TriểnTầm Nhìn & Sứ MệnhGiá Trị Cốt LõiBan Lãnh ĐạoSơ Đồ Tổ ChứcSản phẩmTất cả sản phẩmDự ánTin tứcLiên hệ🇻🇳Tiếng Việt🇺🇸English🇨🇳中文简体0982 818 2730968 297 104Thiendongvnit@gmail.com52 Ấp Đồng Chinh, Xã Phước Hoà, Huyện Phú Giáo, Tỉnh Bình DươngTìm kiếm nhanhĐăng nhậpTHIÊN ĐỒNG VIỆT NAMSản PhẩmKhám phá bộ sưu tập vật liệu nội thất cao cấp của chúng tôiTrang ChủSản PhẩmDANH MỤCDANH MỤCDanh mục sản phẩm0Tất cả sản phẩm0Tất cả —  — 0 sản phẩmĐang tải sản phẩm...THIÊN ĐỒNG VIỆT NAMUY TÍN TỪ NHỮNG ĐIỀU NHỎ NHẤT52 Ấp Đồng ChinhXã Phước HoàHuyện Phú GiáoTỉnh Bình DươngSĐT:0948.929.744E-mail:thiendongintl@gmail.comGiới thiệuTổng Quan Công TyLịch Sử Phát TriểnTầm Nhìn & Sứ MệnhGiá Trị Cốt LõiBan Lãnh ĐạoSơ Đồ Tổ ChứcNăng lựcHình Ảnh Nhà MáyCông Nghệ Sản XuấtChứng Nhận ISO & CESản phẩmDanh Mục Sản PhẩmDự ánDự Án Tiêu BiểuTin tứcTin Tức Mới NhấtLiên hệLiên Hệ Chúng TôiLiên hệBản quyền © THIÊN ĐỒNG VIỆT NAMUY TÍN TỪ NHỮNG ĐIỀU NHỎ NHẤTHỗ trợ kỹ thuật: UY TÍN TỪ NHỮNG ĐIỀU NHỎ NHẤT
    
  

"
    12 × locator resolved to <body data-aos-delay="0" data-aos-duration="800" data-aos-easing="ease-in-out">…</body>
       - unexpected value "
    0982 818 273Thiendongvnit@gmail.com52 Ấp Đồng Chinh, Xã Phước Hoà, Huyện Phú Giáo, Tỉnh Bình DươngTHIÊN ĐỒNGVIỆT NAMTrang chủGiới thiệuVề Chúng TôiLịch Sử Phát TriểnTầm Nhìn & Sứ MệnhGiá Trị Cốt LõiBan Lãnh ĐạoSơ Đồ Tổ ChứcSản phẩmTất cả sản phẩmDự ánTin tứcLiên hệ🌐Tiếng ViệtĐăng nhậpTHIÊN ĐỒNGVIỆT NAMTrang chủGiới thiệuVề Chúng TôiLịch Sử Phát TriểnTầm Nhìn & Sứ MệnhGiá Trị Cốt LõiBan Lãnh ĐạoSơ Đồ Tổ ChứcSản phẩmTất cả sản phẩmDự ánTin tứcLiên hệ🇻🇳Tiếng Việt🇺🇸English🇨🇳中文简体0982 818 2730968 297 104Thiendongvnit@gmail.com52 Ấp Đồng Chinh, Xã Phước Hoà, Huyện Phú Giáo, Tỉnh Bình DươngTìm kiếm nhanhĐăng nhậpTHIÊN ĐỒNG VIỆT NAMSản PhẩmKhám phá bộ sưu tập vật liệu nội thất cao cấp của chúng tôiTrang ChủSản PhẩmDANH MỤCDANH MỤCDanh mục sản phẩm0Tất cả sản phẩm0Tất cả —  — 0 sản phẩmKhông tìm thấy sản phẩm phù hợp.THIÊN ĐỒNG VIỆT NAMUY TÍN TỪ NHỮNG ĐIỀU NHỎ NHẤT52 Ấp Đồng ChinhXã Phước HoàHuyện Phú GiáoTỉnh Bình DươngSĐT:0948.929.744E-mail:thiendongintl@gmail.comGiới thiệuTổng Quan Công TyLịch Sử Phát TriểnTầm Nhìn & Sứ MệnhGiá Trị Cốt LõiBan Lãnh ĐạoSơ Đồ Tổ ChứcNăng lựcHình Ảnh Nhà MáyCông Nghệ Sản XuấtChứng Nhận ISO & CESản phẩmDanh Mục Sản PhẩmDự ánDự Án Tiêu BiểuTin tứcTin Tức Mới NhấtLiên hệLiên Hệ Chúng TôiLiên hệBản quyền © THIÊN ĐỒNG VIỆT NAMUY TÍN TỪ NHỮNG ĐIỀU NHỎ NHẤTHỗ trợ kỹ thuật: UY TÍN TỪ NHỮNG ĐIỀU NHỎ NHẤT
    
  

"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e6]:
      - generic [ref=e8]:
        - generic [ref=e9]:
          - link "0982 818 273" [ref=e10] [cursor=pointer]:
            - /url: tel:0982818273
            - img [ref=e11]
            - generic [ref=e13]: 0982 818 273
          - link "Thiendongvnit@gmail.com" [ref=e14] [cursor=pointer]:
            - /url: mailto:Thiendongvnit@gmail.com
            - img [ref=e15]
            - generic [ref=e18]: Thiendongvnit@gmail.com
        - generic [ref=e20]:
          - img [ref=e21]
          - generic [ref=e24]: 52 Ấp Đồng Chinh, Xã Phước Hoà, Huyện Phú Giáo, Tỉnh Bình Dương
      - generic [ref=e26]:
        - link "Thiên Đồng Việt Nam" [ref=e28] [cursor=pointer]:
          - /url: /
          - img "THIÊN ĐỒNG VIỆT NAM logo" [ref=e29]
          - generic [ref=e30]:
            - strong [ref=e31]: THIÊN ĐỒNG
            - generic [ref=e32]: VIỆT NAM
        - navigation "Main navigation" [ref=e33]:
          - link "Trang chủ" [ref=e36] [cursor=pointer]:
            - /url: /
          - link "Giới thiệu" [ref=e39] [cursor=pointer]:
            - /url: /about/company-introduction
          - link "Sản phẩm" [ref=e42] [cursor=pointer]:
            - /url: /products
          - link "Dự án" [ref=e45] [cursor=pointer]:
            - /url: /du-an
          - link "Tin tức" [ref=e48] [cursor=pointer]:
            - /url: /news
          - link "Liên hệ" [ref=e51] [cursor=pointer]:
            - /url: /contact
        - generic [ref=e52]:
          - button "Select language" [ref=e54]:
            - text: 🌐Tiếng Việt
            - img [ref=e55]
          - generic [ref=e57]:
            - link "Giỏ hàng" [ref=e58] [cursor=pointer]:
              - /url: /cart
              - img [ref=e59]
            - link "Đăng nhập" [ref=e63] [cursor=pointer]:
              - /url: /login
              - img [ref=e64]
              - generic [ref=e67]: Đăng nhập
    - complementary [ref=e68]:
      - generic [ref=e69]:
        - link "THIÊN ĐỒNG VIỆT NAM THIÊN ĐỒNG VIỆT NAM" [ref=e70] [cursor=pointer]:
          - /url: /
          - img "THIÊN ĐỒNG VIỆT NAM" [ref=e71]
          - generic [ref=e72]:
            - strong [ref=e73]: THIÊN ĐỒNG
            - generic [ref=e74]: VIỆT NAM
        - button [ref=e75] [cursor=pointer]:
          - img [ref=e76]
      - generic [ref=e79]:
        - link "Trang chủ" [ref=e82] [cursor=pointer]:
          - /url: /
        - generic [ref=e83]:
          - generic [ref=e84]:
            - link "Giới thiệu" [ref=e85] [cursor=pointer]:
              - /url: /about/company-introduction
            - button "Toggle Giới thiệu" [ref=e86]:
              - img [ref=e87]
          - generic:
            - link "Về Chúng Tôi" [ref=e89] [cursor=pointer]:
              - /url: /about/company-introduction
              - generic [ref=e90]: Về Chúng Tôi
            - link "Lịch Sử Phát Triển" [ref=e91] [cursor=pointer]:
              - /url: /about/development-course
              - generic [ref=e92]: Lịch Sử Phát Triển
            - link "Tầm Nhìn & Sứ Mệnh" [ref=e93] [cursor=pointer]:
              - /url: /about/corporate-culture
              - generic [ref=e94]: Tầm Nhìn & Sứ Mệnh
            - link "Giá Trị Cốt Lõi" [ref=e95] [cursor=pointer]:
              - /url: /about/corporate-culture
              - generic [ref=e96]: Giá Trị Cốt Lõi
            - link "Ban Lãnh Đạo" [ref=e97] [cursor=pointer]:
              - /url: /about/leadership-care
              - generic [ref=e98]: Ban Lãnh Đạo
            - link "Sơ Đồ Tổ Chức" [ref=e99] [cursor=pointer]:
              - /url: /about/organization-chart
              - generic [ref=e100]: Sơ Đồ Tổ Chức
        - generic [ref=e101]:
          - generic [ref=e102]:
            - link "Sản phẩm" [ref=e103] [cursor=pointer]:
              - /url: /products
            - button "Toggle Sản phẩm" [ref=e104]:
              - img [ref=e105]
          - link "Tất cả sản phẩm" [ref=e107] [cursor=pointer]:
            - /url: /products
            - generic [ref=e108]: Tất cả sản phẩm
        - link "Dự án" [ref=e111] [cursor=pointer]:
          - /url: /du-an
        - link "Tin tức" [ref=e114] [cursor=pointer]:
          - /url: /news
        - link "Liên hệ" [ref=e117] [cursor=pointer]:
          - /url: /contact
      - generic [ref=e118]:
        - generic [ref=e119]:
          - button "🇻🇳Tiếng Việt" [ref=e120]
          - button "🇺🇸English" [ref=e121]
          - button "🇨🇳中文简体" [ref=e122]
        - link "0982 818 273" [ref=e123] [cursor=pointer]:
          - /url: tel:0982818273
          - img [ref=e124]
          - generic [ref=e126]: 0982 818 273
        - link "0968 297 104" [ref=e127] [cursor=pointer]:
          - /url: tel:0968297104
          - img [ref=e128]
          - generic [ref=e130]: 0968 297 104
        - link "Thiendongvnit@gmail.com" [ref=e131] [cursor=pointer]:
          - /url: mailto:Thiendongvnit@gmail.com
          - img [ref=e132]
          - generic [ref=e135]: Thiendongvnit@gmail.com
        - generic [ref=e136]:
          - img [ref=e137]
          - generic [ref=e140]: 52 Ấp Đồng Chinh, Xã Phước Hoà, Huyện Phú Giáo, Tỉnh Bình Dương
        - button "Tìm kiếm nhanh" [ref=e141] [cursor=pointer]:
          - img [ref=e142]
          - generic [ref=e145]: Tìm kiếm nhanh
        - link "Đăng nhập" [ref=e146] [cursor=pointer]:
          - /url: /login
          - img [ref=e147]
          - generic [ref=e150]: Đăng nhập
  - main [ref=e151]:
    - generic [ref=e152]:
      - generic [ref=e153]:
        - generic [ref=e155]:
          - paragraph [ref=e156]: THIÊN ĐỒNG VIỆT NAM
          - heading "Sản Phẩm" [level=1] [ref=e157]
          - paragraph [ref=e159]: Khám phá bộ sưu tập vật liệu nội thất cao cấp của chúng tôi
        - navigation "Breadcrumb" [ref=e160]:
          - link "Trang Chủ" [ref=e161] [cursor=pointer]:
            - /url: /
            - img [ref=e162]
            - text: Trang Chủ
          - img [ref=e165]
          - generic [ref=e167]: Sản Phẩm
      - generic [ref=e168]:
        - complementary [ref=e169]:
          - generic [ref=e171]:
            - img [ref=e172]
            - generic [ref=e173]: DANH MỤC
          - generic [ref=e174]:
            - generic [ref=e175]:
              - generic [ref=e176]:
                - generic [ref=e177]: DANH MỤC
                - strong [ref=e178]: Danh mục sản phẩm
              - generic [ref=e179]: "0"
            - list [ref=e180]:
              - listitem [ref=e181]:
                - button "Tất cả sản phẩm 0" [ref=e182] [cursor=pointer]:
                  - generic [ref=e184]: Tất cả sản phẩm
                  - generic [ref=e185]: "0"
        - main [ref=e186]:
          - generic [ref=e187]:
            - generic [ref=e189]:
              - strong [ref=e190]: Tất cả
              - text: — — 0 sản phẩm
            - generic [ref=e191]:
              - img [ref=e192]
              - textbox "Tìm sản phẩm, mã SKU..." [ref=e195]
          - paragraph [ref=e197]: Không tìm thấy sản phẩm phù hợp.
  - contentinfo [ref=e198]:
    - generic [ref=e201]:
      - generic [ref=e202]:
        - generic [ref=e203]:
          - link "THIÊN ĐỒNG VIỆT NAM" [ref=e204] [cursor=pointer]:
            - /url: /
            - img "THIÊN ĐỒNG VIỆT NAM" [ref=e205]
          - generic [ref=e206]:
            - strong [ref=e207]: THIÊN ĐỒNG VIỆT NAM
            - generic [ref=e208]: UY TÍN TỪ NHỮNG ĐIỀU NHỎ NHẤT
          - generic [ref=e209]:
            - link "address 52 Ấp Đồng Chinh Xã Phước Hoà Huyện Phú Giáo Tỉnh Bình Dương" [ref=e210] [cursor=pointer]:
              - /url: https://map.baidu.com/poi/%E8%8D%B7%E5%8D%8E%E6%98%8E%E5%9F%8E%E5%A4%A7%E5%8E%A6-C%E5%BA%A7/@12962304.37,4825324.01,17z?uid=66332e4f3e1ae3326040a9c3&ugc_type=3&ugc_ver=1&device_ratio=1&compat=1&pcevaname=pc4.1&querytype=detailConInfo&da_src=shareurl
              - img "address" [ref=e211]
              - generic [ref=e212]:
                - generic [ref=e213]: 52 Ấp Đồng Chinh
                - generic [ref=e214]: Xã Phước Hoà
                - generic [ref=e215]: Huyện Phú Giáo
                - generic [ref=e216]: Tỉnh Bình Dương
            - link "phone SĐT:0948.929.744" [ref=e217] [cursor=pointer]:
              - /url: tel:0948.929.744
              - img "phone" [ref=e218]
              - generic [ref=e219]: SĐT:0948.929.744
            - link "email E-mail:thiendongintl@gmail.com" [ref=e220] [cursor=pointer]:
              - /url: mailto:thiendongintl@gmail.com
              - img "email" [ref=e221]
              - generic [ref=e222]: E-mail:thiendongintl@gmail.com
        - generic [ref=e223]:
          - generic [ref=e224]:
            - link "Giới thiệu" [ref=e225] [cursor=pointer]:
              - /url: /about/company-introduction
            - generic [ref=e227]:
              - link "Tổng Quan Công Ty" [ref=e229] [cursor=pointer]:
                - /url: /about/company-introduction
              - link "Lịch Sử Phát Triển" [ref=e231] [cursor=pointer]:
                - /url: /about/development-course
              - link "Tầm Nhìn & Sứ Mệnh" [ref=e233] [cursor=pointer]:
                - /url: /about/corporate-culture
              - link "Giá Trị Cốt Lõi" [ref=e235] [cursor=pointer]:
                - /url: /about/corporate-culture
              - link "Ban Lãnh Đạo" [ref=e237] [cursor=pointer]:
                - /url: /about/leadership-care
              - link "Sơ Đồ Tổ Chức" [ref=e239] [cursor=pointer]:
                - /url: /about/organization-chart
          - generic [ref=e240]:
            - link "Năng lực" [ref=e241] [cursor=pointer]:
              - /url: /honors
            - generic [ref=e243]:
              - link "Hình Ảnh Nhà Máy" [ref=e245] [cursor=pointer]:
                - /url: /honors
              - link "Công Nghệ Sản Xuất" [ref=e247] [cursor=pointer]:
                - /url: /honors
              - link "Chứng Nhận ISO & CE" [ref=e249] [cursor=pointer]:
                - /url: /honors
          - generic [ref=e250]:
            - link "Sản phẩm" [ref=e251] [cursor=pointer]:
              - /url: /products
            - link "Danh Mục Sản Phẩm" [ref=e255] [cursor=pointer]:
              - /url: /products
          - generic [ref=e256]:
            - link "Dự án" [ref=e257] [cursor=pointer]:
              - /url: /du-an
            - link "Dự Án Tiêu Biểu" [ref=e261] [cursor=pointer]:
              - /url: /du-an
          - generic [ref=e262]:
            - link "Tin tức" [ref=e263] [cursor=pointer]:
              - /url: /news
            - link "Tin Tức Mới Nhất" [ref=e267] [cursor=pointer]:
              - /url: /news
          - generic [ref=e268]:
            - link "Liên hệ" [ref=e269] [cursor=pointer]:
              - /url: /contact
            - link "Liên Hệ Chúng Tôi" [ref=e273] [cursor=pointer]:
              - /url: /contact
      - generic [ref=e275]:
        - link "Liên hệ" [ref=e278] [cursor=pointer]:
          - /url: /contact
        - generic [ref=e279]:
          - generic [ref=e280]: Bản quyền © THIÊN ĐỒNG VIỆT NAM
          - link:
            - /url: https://beian.miit.gov.cn/#/Integrated/index
          - generic [ref=e281]: UY TÍN TỪ NHỮNG ĐIỀU NHỎ NHẤT
          - generic [ref=e282]: "Hỗ trợ kỹ thuật: UY TÍN TỪ NHỮNG ĐIỀU NHỎ NHẤT"
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | 
  3   | const uniqueSeed = Date.now()
  4   | const qaEmail = `qa_${uniqueSeed}@example.com`
  5   | const qaPassword = 'Test@123456'
  6   | const regularProduct = {
  7   |   name: 'Travertine',
  8   |   slug: 'travertine',
  9   |   price: '1.290.000',
  10  |   stock: 24,
  11  | }
  12  | const saleProduct = {
  13  |   name: 'Travertine 3D',
  14  |   slug: 'travertine-3d',
  15  |   salePrice: '1.390.000',
  16  |   originalPrice: '1.490.000',
  17  |   stock: 8,
  18  | }
  19  | 
  20  | test.describe('storefront pricing and stock flow', () => {
  21  |   test('keeps pricing and stock consistent from product to order history', async ({ page }) => {
  22  |     test.setTimeout(180_000)
  23  | 
  24  |     await page.goto('/products')
  25  |     await expect(page).toHaveURL(/\/products/)
> 26  |     await expect(page.locator('body')).toContainText(regularProduct.name)
      |                                        ^ Error: expect(locator).toContainText(expected) failed
  27  |     await expect(page.locator('body')).toContainText(saleProduct.name)
  28  |     await expect(page.locator('body')).toContainText(regularProduct.price)
  29  |     await expect(page.locator('body')).toContainText(saleProduct.salePrice)
  30  |     await expect(page.locator('body')).toContainText(saleProduct.originalPrice)
  31  | 
  32  |     await page.goto(`/products/${regularProduct.slug}`)
  33  |     await expect(page.locator('body')).toContainText(regularProduct.price)
  34  |     await expect(page.locator('body')).toContainText('Còn 24 sản phẩm')
  35  | 
  36  |     await page.goto(`/products/${saleProduct.slug}`)
  37  |     await expect(page.locator('body')).toContainText(saleProduct.salePrice)
  38  |     await expect(page.locator('body')).toContainText(saleProduct.originalPrice)
  39  |     await expect(page.locator('body')).toContainText('Còn 8 sản phẩm')
  40  | 
  41  |     await page.goto('/register')
  42  |     await page.locator('input[type="email"]').fill(qaEmail)
  43  |     await page.locator('input[placeholder="username"]').fill(`qa_${uniqueSeed}`)
  44  |     await page.locator('input[type="tel"]').fill('0982000000')
  45  |     await page.locator('input[type="password"]').nth(0).fill(qaPassword)
  46  |     await page.locator('input[type="password"]').nth(1).fill(qaPassword)
  47  |     await page.getByRole('button', { name: 'Đăng ký' }).click()
  48  |     await expect(page.locator('.success-message')).toContainText('thành công')
  49  |     await page.waitForURL(/\/login/, { timeout: 10_000 })
  50  | 
  51  |     await page.locator('input[type="email"]').fill(qaEmail)
  52  |     await page.locator('input[type="password"]').first().fill(qaPassword)
  53  |     await page.getByRole('button', { name: 'Đăng nhập' }).click()
  54  |     await expect(page.locator('.success-message')).toContainText('thành công')
  55  |     await page.waitForURL(/\/$/, { timeout: 10_000 })
  56  | 
  57  |     await page.goto(`/products/${saleProduct.slug}`)
  58  |     await page.getByRole('button', { name: 'Thêm vào giỏ hàng' }).click()
  59  |     await page.goto('/cart')
  60  |     await expect(page.locator('body')).toContainText(saleProduct.name)
  61  |     await expect(page.locator('.cart-row__stock')).toContainText('Còn 8 sản phẩm')
  62  |     await expect(page.locator('.cart-price-block')).toContainText(saleProduct.salePrice)
  63  |     await expect(page.locator('.cart-price-block')).toContainText(saleProduct.originalPrice)
  64  | 
  65  |     const saleQuantityValue = page.locator('.quantity-control span').first()
  66  |     const saleIncreaseButton = page.locator('.quantity-control button').nth(1)
  67  |     for (let quantity = 1; quantity < saleProduct.stock; quantity += 1) {
  68  |       await expect(saleQuantityValue).toHaveText(String(quantity))
  69  |       await saleIncreaseButton.click()
  70  |     }
  71  |     await expect(saleQuantityValue).toHaveText(String(saleProduct.stock))
  72  |     await expect(saleIncreaseButton).toBeDisabled()
  73  | 
  74  |     await page.goto(`/products/${regularProduct.slug}`)
  75  |     await page.getByRole('button', { name: 'Thêm vào giỏ hàng' }).click()
  76  | 
  77  |     await page.goto('/cart')
  78  |     const cartRows = page.locator('.cart-row')
  79  |     await expect(cartRows).toHaveCount(2)
  80  |     const saleRow = cartRows.filter({ hasText: saleProduct.name })
  81  |     const regularRow = cartRows.filter({ hasText: regularProduct.name })
  82  |     await expect(saleRow).toContainText('11.120.000')
  83  |     await expect(regularRow).toContainText(regularProduct.price)
  84  |     await expect(page.locator('.cart-summary__row--total')).toContainText('12.410.000')
  85  | 
  86  |     await page.getByRole('button', { name: 'TIẾN HÀNH THANH TOÁN' }).click()
  87  |     await expect(page).toHaveURL(/\/checkout/)
  88  |     await expect(page.locator('.checkout-summary-list')).toContainText(saleProduct.name)
  89  |     await expect(page.locator('.checkout-summary-list')).toContainText(regularProduct.name)
  90  |     await expect(page.locator('.checkout-summary-list')).toContainText(saleProduct.salePrice)
  91  |     await expect(page.locator('.checkout-summary-list')).toContainText(saleProduct.originalPrice)
  92  |     await expect(page.locator('.checkout-total-row--grand')).toContainText('12.410.000')
  93  | 
  94  |     await page.locator('input[placeholder="Nhập họ và tên của bạn"]').fill('QA Automation User')
  95  |     await page.locator('input[placeholder="Nhập địa chỉ nhận hàng"]').fill('123 QA Street, Ha Noi')
  96  |     await page.locator('input[placeholder="Nhập số điện thoại"]').fill('0982000000')
  97  |     await page.locator('input[placeholder="Nhập email của bạn"]').fill(qaEmail)
  98  |     await page.locator('textarea[placeholder*="Nhập ghi chú"]').fill('Playwright automated checkout')
  99  |     await page.getByRole('button', { name: 'ĐẶT HÀNG' }).click()
  100 | 
  101 |     await expect(page.locator('.checkout-success')).toContainText('Đặt hàng thành công!')
  102 |     await expect(page.locator('.checkout-success')).toContainText('12.410.000')
  103 |     const orderCodeText = await page.locator('.checkout-success strong').first().textContent()
  104 |     const orderCode = orderCodeText?.trim() || ''
  105 |     expect(orderCode.length).toBeGreaterThan(0)
  106 | 
  107 |     await page.goto('/profile?tab=orders')
  108 |     await expect(page.locator('.profile-order-list')).toContainText(orderCode)
  109 |     await expect(page.locator('.profile-order-list')).toContainText(saleProduct.salePrice)
  110 |     await expect(page.locator('.profile-order-list')).toContainText(saleProduct.originalPrice)
  111 |     await expect(page.locator('.profile-order-list')).toContainText('12.410.000')
  112 | 
  113 |     const latestOrderCard = page.locator('.profile-order-card').first()
  114 |     await latestOrderCard.getByRole('button', { name: 'Xem chi tiết' }).click()
  115 |     await expect(page).toHaveURL(/\/orders\/\d+/)
  116 |     await expect(page.locator('.order-detail-content')).toContainText(orderCode)
  117 |     await expect(page.locator('.order-products')).toContainText(saleProduct.name)
  118 |     await expect(page.locator('.order-products')).toContainText(regularProduct.name)
  119 |     await expect(page.locator('.order-products')).toContainText(saleProduct.salePrice)
  120 |     await expect(page.locator('.order-products')).toContainText(saleProduct.originalPrice)
  121 |     await expect(page.locator('.order-product-card__line-total')).toContainText('11.120.000')
  122 |     await expect(page.locator('.order-detail-summary')).toContainText('12.410.000')
  123 |   })
  124 | })
  125 | 
```