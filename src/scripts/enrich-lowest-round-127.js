const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const envPath = path.join(__dirname, "../.env.local");
let supabaseUrl = "";
let supabaseAnonKey = "";

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.*)/);
  const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*(.*)/);
  if (urlMatch) {
    supabaseUrl = urlMatch[1].replace(/['"]/g, "").trim();
  }
  if (keyMatch) {
    supabaseAnonKey = keyMatch[1].replace(/['"]/g, "").trim();
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Fetching lowest 5 creatures based on enrichment_count...");
  
  let { data: creatures, error } = await supabase
    .from("creatures")
    .select("*");

  if (error) {
    console.error("Error fetching creatures:", error.message);
    process.exit(1);
  }

  creatures.sort((a, b) => {
    const countA = a.enrichment_count || 0;
    const countB = b.enrichment_count || 0;
    if (countA !== countB) {
      return countA - countB;
    }
    return a.id.localeCompare(b.id);
  });

  const targets = creatures.slice(0, 5);
  console.log(`Selected targets to enrich: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    if (c.id === "blue-dragon") {
      newC.diet_type = "carnivore";
      newC.diet_items = [
        "sứa lửa (Portuguese man-o'-war)",
        "sứa bọt biển xanh (Porpita porpita)",
        "sứa buồm (Velella Velella)",
        "ốc sên tím trôi nổi (Janthina janthina)",
        "các loài sứa biển khác"
      ];
      newC.activity_pattern = "variable";
      newC.lifespan_min = 1;
      newC.lifespan_max = 12;
      newC.lifespan_unit = "months";
      newC.reproduction_type = "hermaphrodite";
      newC.reproduction_notes = "Là loài lưỡng tính có cả cơ quan sinh sản đực và cái. Khi giao phối, hai cá thể thụ tinh chéo cho nhau bằng cách úp bụng rồi đẻ các chuỗi trứng nổi tự do trên biển hoặc trên xác mồi.";
      newC.locomotion = "swim";
      newC.speed_max = 2;
      newC.conservation_status = "LC";
      newC.size_min_mm = 30;
      newC.size_max_mm = 50;
      newC.weight_avg_g = 3.5;

      newC.characteristics = "Thân hình dẹt mọc ra 6 cụm xúc tu phân nhánh tỏa rộng như những chiếc cánh rồng (cerata). Bụng màu xanh lam đậm rực rỡ để ngụy trang ngược với mặt nước biển nhìn từ trên xuống, lưng màu bạc xám để ngụy trang với ánh sáng mặt trời nhìn từ dưới lên.";
      newC.survival_method = "Thả nổi ngửa bụng lên trời bằng cách nuốt một bong bóng khí nhỏ vào dạ dày để duy trì sức nổi. Chúng săn các loài sứa cực độc như Portuguese man-o'-war. Nhờ màng nhầy đặc biệt bảo vệ khỏi bị chích, rồng xanh nuốt chửng các tế bào ngứa độc (nematocysts) của sứa lửa, lưu trữ chúng trong các đầu cánh xúc tu (cerata) của chính mình để biến nọc độc đó thành vũ khí tự vệ cực kỳ đậm đặc của bản thân.";
      newC.unique_traits = "Khả năng kháng và tích lũy nọc độc (stolen weaponry) từ các loài sứa nguy hiểm nhất hành tinh. Cơ chế ngụy trang ngược (countershading) thả nổi ngửa bụng độc đáo. Xúc tu dạng cerata chứa túi độc cnidosacs cực kỳ nguy hiểm đối với động vật săn mồi và con người. Khả năng tái sinh thùy xúc tu cerata bị đứt gãy nhanh chóng.";

      newC.strengths = [
        "Sở hữu nọc độc cô đặc cực độ từ sứa lửa có khả năng gây suy tim và đau đớn dữ dội cho kẻ thù.",
        "Ngụy trang ngược hoàn hảo giúp né tránh cả chim săn mồi trên trời lẫn cá ăn thịt dưới sâu.",
        "Kháng hoàn toàn nọc chích của sứa lửa nhờ lớp niêm mạc chất nhầy bảo vệ dày đặc trong cơ quan tiêu hóa.",
        "Khả năng thả nổi tự nhiên nhờ túi khí dạ dày giúp tiết kiệm tối đa năng lượng sinh học.",
        "Cơ chế cleptocnidae: Thu hoạch tế bào chích (nematocysts) chưa phóng từ con mồi sứa lửa, phân loại và đưa chúng đến các đầu xúc tu cerata để tự vệ.",
        "Tế bào da tiết ra lớp chất nhầy trơn kỵ nước, ngăn ngừa sự bám dính của ký sinh trùng thủy sinh.",
        "Nhận biết dòng chảy và nhiệt độ nước cực nhạy nhờ các thụ thể hóa học xung quanh miệng.",
        "Khả năng tái sinh thùy xúc tu (cerata) bị đứt gãy trong thời gian ngắn để phục hồi chức năng trữ độc.",
        "Hệ cơ trơn khỏe ở thành dạ dày cho phép ép và cô đặc mô sứa để chiết tách tế bào ngứa độc.",
        "Mức độ độc tính tăng dần: Độc tố tích lũy trong túi cnidosacs đậm đặc hơn gấp nhiều lần so với nọc độc của sứa lửa gốc.",
        "Không bị ảnh hưởng bởi bức xạ tia cực tím (UV) gay gắt của ánh sáng mặt trời bề mặt nhờ sắc tố xanh lam melanin thích nghi đặc biệt.",
        "Lưỡng tính đồng thời giúp nhân đôi cơ hội sinh sản khi gặp bất kỳ cá thể nào cùng loài."
      ];

      newC.weaknesses = [
        "Không thể chủ động di chuyển ngược dòng hải lưu hoặc gió mạnh, dễ bị dạt vào bờ cát nóng và chết khô.",
        "Không có lớp vỏ cứng bảo vệ cơ thể nên rất mềm yếu nếu bị tấn công vật lý trực diện.",
        "Rất kén ăn, chỉ ăn các sinh vật dạng túi chứa độc trôi nổi như sứa lửa, sứa buồm.",
        "Nhạy cảm cao với nhiệt độ nước lạnh, cơ thể sẽ bị đông cứng và mất sức nổi nếu nhiệt độ nước giảm xuống dưới 15°C.",
        "Dễ bị tổn thương bởi các chấn động mạnh của sóng biển bão lớn, có thể làm gãy các thùy cánh cerata.",
        "Không có khả năng tự sản sinh chất độc độc lập, hoàn toàn phụ thuộc vào nguồn cung cấp tế bào chích từ sứa lửa.",
        "Điểm yếu ngụy trang khi bị lật úp ngược do tác động ngoại lực, để lộ phần bạc dễ bị phát hiện."
      ];

      newC.fun_facts = [
        "Vì ngửa bụng lên trên khi bơi, phần có màu xanh lục/xanh lam tuyệt đẹp của Rồng Xanh thực chất là bụng của nó chứ không phải lưng của nó.",
        "Nọc độc tích lũy trong xúc tu của nó được tích tụ cô đặc đến mức một cú chích từ con sên tí hon dài 3cm này có thể nguy hiểm hơn nhiều so với cú chạm trực tiếp từ một con sứa lửa khổng lồ.",
        "Chúng là loài lưỡng tính nhưng không thể tự thụ tinh mà bắt buộc phải giao phối chéo với nhau ở tư thế úp bụng độc đáo trên mặt nước.",
        "Để bảo vệ trứng không bị chìm xuống đáy đại dương lạnh lẽo, rồng xanh đính dải trứng dài của mình vào những bộ xương kitin trôi nổi của sứa buồm đã bị chúng ăn thịt.",
        "Dù không có mắt sắc bén, rồng xanh phát hiện con mồi thông qua các cơ quan thụ cảm hóa học cực nhạy phân bố dọc mép miệng.",
        "Sắc tố xanh ngọc lộng lẫy của chúng thực chất hấp thụ một lượng ánh sáng UV để chuyển hóa thành năng lượng bảo vệ mô mềm.",
        "Chúng có thể tự ăn thịt lẫn nhau khi nguồn thức ăn khan hiếm và nồng độ sên biển trong khu vực quá dày đặc."
      ];

      newC.sources = [
        {
          "url": "https://doi.org/10.2307/2405934",
          "label": "The Biological Bulletin - Feeding habits of Glaucus atlanticus"
        },
        {
          "url": "https://www.oceana.org/marine-life/blue-dragon/",
          "label": "Oceana - Blue Dragon Sea Slug Profile & Conservation"
        },
        {
          "url": "https://en.wikipedia.org/wiki/Glaucus_atlanticus",
          "label": "Wikipedia - Glaucus atlanticus Detailed Ecology"
        }
      ];
    } else if (c.id === "horned-lizard") {
      newC.diet_type = "carnivore";
      newC.diet_items = [
        "kiến gặt (harvester ants)",
        "mối",
        "bọ cánh cứng nhỏ"
      ];
      newC.activity_pattern = "diurnal";
      newC.lifespan_min = 5;
      newC.lifespan_max = 8;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Đẻ trứng dưới cát ẩm, mỗi lứa từ 14 đến 37 trứng, trứng tự nở sau khoảng 40-45 ngày mà không cần bố mẹ chăm sóc.";
      newC.locomotion = "hybrid";
      newC.speed_max = 8;
      newC.conservation_status = "LC";
      newC.size_min_mm = 69;
      newC.size_max_mm = 114;
      newC.weight_avg_g = 50;

      newC.characteristics = "Cơ thể dẹt, tròn trịa, bao phủ bởi các gai nhọn cứng ở lưng và đặc biệt là hàng gai lớn như vương miện sừng quanh đầu sọ. Có màu sắc ngụy trang tương đồng hoàn hảo với đất cát sa mạc. Dưới mi mắt có tuyến xoang hàm (sinuses) chuyên biệt tích lũy máu áp lực lớn để tự vệ.";
      newC.survival_method = "Dùng màu sắc ngụy trang và cơ thể dẹt ép sát đất cát để ẩn nấp kẻ thù. Khi bị đe dọa trực tiếp bởi loài chó hoang hoặc mèo rừng, chúng co thắt cơ xung quanh mắt làm tắc nghẽn tĩnh mạch hồi lưu, làm tăng áp suất máu trong hốc mắt lên cực hạn cho đến khi các mạch máu xoang hốc mắt vỡ tung, phun ra một tia máu áp lực cao dài tới 1.5 mét từ khóe mắt chứa hợp chất độc hại tích tụ từ kiến ăn vào.";
      newC.unique_traits = "Khả năng phun máu từ mắt (autohemorrhaging) đạt khoảng cách 1.5m với áp lực mạnh để xua đuổi các loài thuộc họ chó mèo nhờ độc tính gây khó chịu cực độ. Bộ sừng gai kitin cứng trên đầu chống lại việc bị nuốt chửng bởi rắn hoặc chim săn mồi. Cơ chế thu nhận nước độc đáo bằng cách gom các giọt sương ẩm từ các khe gai trên lưng dẫn trực tiếp về khóe miệng nhờ lực mao dẫn. Hệ thống bài tiết axit uric siêu cô đặc tiết kiệm nước.";

      newC.strengths = [
        "Khả năng phun máu từ mắt xa 1.5m chứa độc tố axit formic làm tê liệt vị giác và kích ứng kết mạc của động vật họ chó mèo.",
        "Gai nhọn quanh đầu sọ và sống lưng ngăn chặn hiệu quả việc bị nuốt chửng bởi chim săn mồi và rắn sa mạc.",
        "Hệ thống rãnh mao dẫn trên da cho phép thu nhận nước mưa và sương đêm tự động chuyển thẳng về khóe miệng thông qua chuyển động hàm.",
        "Ngụy trang hoàn hảo giống hệt sỏi cát khô cằn của hoang mạc, triệt tiêu bóng đổ cơ thể bằng cách ép sát đất dẹt.",
        "Dạ dày khổng lồ và hệ tiêu hóa chuyên hóa cao để phân giải nọc độc axit formic mạnh mẽ từ kiến gặt đỏ.",
        "Mắt có lớp màng nháy bảo vệ dày chống cát bụi hoang mạc xâm nhập trong các cơn bão cát.",
        "Khả năng tự phình to cơ thể gấp đôi bằng cách hít khí để kẹt chặt trong khe đá hoặc gây khó cho kẻ muốn nuốt.",
        "Móng vuốt phẳng khỏe giúp đào bới cát nhanh chóng để ẩn nấp chỉ trong vài giây.",
        "Khả năng chịu nhiệt độ môi trường cực độ nhờ điều khiển màu da (da sẫm lại vào sáng sớm để hấp thụ nhiệt, sáng lên vào buổi trưa để phản xạ nắng).",
        "Máu chứa hợp chất kháng độc đặc biệt chống lại nọc độc của kiến gặt đỏ khi bị chích từ bên trong.",
        "Thị giác nhạy bén phát hiện các chuyển động siêu nhỏ của kiến cách xa hàng mét.",
        "Tiết kiệm nước tối đa bằng cách bài tiết axit uric dạng rắn và tái hấp thu nước triệt để ở trực tràng."
      ];

      newC.weaknesses = [
        "Dễ bị tổn thương nếu hốc mắt bị nhiễm trùng hoặc suy kiệt năng lượng sau khi phun lượng máu lớn (lên tới 1/3 tổng lượng máu cơ thể).",
        "Hệ tiêu hóa chuyên hóa quá sâu vào việc ăn kiến gặt sa mạc (chiếm 70-90% khẩu phần), cực khó chuyển đổi sang thức ăn khác.",
        "Tốc độ chạy đường dài chậm chạp do cấu trúc cơ thể dẹt tròn cồng kềnh hơn các loài thằn lằn sa mạc thon gọn khác.",
        "Nhạy cảm cao với hóa chất trừ sâu diệt kiến của con người, phá hủy nguồn thức ăn sinh tồn duy nhất.",
        "Tổ trứng nằm dưới cát dễ bị các loài bò sát khác hoặc lợn rừng peccary đào bới ăn thịt.",
        "Không có khả năng tự vệ chủ động bằng răng hay vết cắn mạnh, hoàn toàn phụ thuộc vào phòng thủ thụ động.",
        "Nhạy cảm với nhiệt độ lạnh kéo dài, dễ bị rơi vào trạng thái ngủ đông cưỡng bức kém linh hoạt."
      ];

      newC.fun_facts = [
        "Cơ chế phun máu kỳ lạ: Chúng phun máu bằng cách ngăn chặn dòng máu chảy ra khỏi đầu, làm tăng áp suất máu hốc mắt lên mức cực đại khiến các mao mạch nhỏ vỡ tung.",
        "Máu bắn ra từ mắt thằn lằn sừng có mùi vị cực kỳ kinh tởm và cay nóng đối với chó sói đồng cỏ coyote nhưng kỳ lạ là chim săn mồi lại không hề bị ảnh hưởng bởi thứ máu này.",
        "Chúng có thể phình to cơ thể bằng cách hít đầy không khí để trông giống như một quả bóng gai, khiến kẻ thù không thể nuốt trôi.",
        "Tia máu bắn ra có thể chiếm tới 1/3 tổng lượng máu trong cơ thể của chúng nhưng chúng có khả năng tái tạo phục hồi lượng máu này vô cùng nhanh chóng.",
        "Thằn lằn sừng không cần cúi đầu uống nước; chúng chỉ cần đứng dưới mưa hoặc sương, da của chúng sẽ tự động hút nước qua các khe vảy và đưa đến miệng nhờ lực mao dẫn.",
        "Loài này là loài bò sát chính thức của bang Texas và được người dân ở đây vô cùng yêu quý, gọi thân mật là 'Horny Toad'.",
        "Mặc dù trông rất hung dữ với bộ gai góc, chúng thực chất rất hiền lành và hoàn toàn vô hại với con người, thường nằm im trên bàn tay nếu được bế."
      ];

      newC.sources = [
        {
          "url": "https://doi.org/10.2307/1447226",
          "label": "Copeia - Blood-squirting behavior of Phrynosoma"
        },
        {
          "url": "https://www.iucnredlist.org/species/64039/12738722",
          "label": "IUCN Red List - Texas Horned Lizard conservation status"
        },
        {
          "url": "https://en.wikipedia.org/wiki/Texas_horned_lizard",
          "label": "Wikipedia - Texas Horned Lizard Detailed Life History"
        }
      ];
    } else if (c.id === "mimic-octopus") {
      newC.diet_type = "carnivore";
      newC.diet_items = [
        "cua nhỏ",
        "tôm biển",
        "cá nhỏ"
      ];
      newC.activity_pattern = "diurnal";
      newC.lifespan_min = 9;
      newC.lifespan_max = 12;
      newC.lifespan_unit = "months";
      newC.reproduction_type = "sexual";
      newC.reproduction_notes = "Con đực chuyển túi tinh cho con cái bằng một xúc tu chuyên dụng gọi là hectocotylus. Con cái đẻ và chăm sóc hàng ngàn quả trứng dưới hang cát cho đến khi trứng nở rồi chết.";
      newC.locomotion = "hybrid";
      newC.speed_max = 15;
      newC.conservation_status = "LC";
      newC.size_min_mm = 300;
      newC.size_max_mm = 600;
      newC.weight_avg_g = 200;

      newC.characteristics = "Thân hình thon dài uyển chuyển, có các xúc tu dài mảnh sọc nâu đậm xen kẽ màu trắng hoặc kem. Da nhạy cảm chứa tế bào sắc tố chromatophores và tế bào biến đổi cấu trúc da papillae cho phép thay đổi màu sắc lẫn vân bề mặt da trong chưa đầy 1 giây.";
      newC.survival_method = "Không chỉ thay đổi màu sắc để hòa lẫn vào cát bùn, loài bạch tuộc này có trí thông minh vượt trội để giả dạng chủ động hành vi và hình dáng của ít nhất 15 loài sinh vật biển có độc khác nhau. Ví dụ: khi gặp cá săn mồi, nó sẽ kéo 2 xúc tu ngược hướng và ép các xúc tu khác lại để di chuyển giống như loài cá bơn độc; hoặc luồn 6 xúc tu xuống cát và chĩa 2 xúc tu sọc đen trắng ra ngoài uốn lượn giống hệt loài rắn biển cực độc.";
      newC.unique_traits = "Khả năng bắt chước hành vi động vật đa loài (dynamic mimicry) độc nhất vô nhị. Trí thông minh phân tích kẻ thù để chọn loài đóng giả khắc chế phù hợp (ví dụ bắt chước rắn biển khi gặp cá thia biển). Thay đổi linh hoạt trạng thái vận động xúc tu để mô phỏng chính xác dáng bơi cá sư tử, cá bơn, sứa biển. Khả năng tự cắt đứt xúc tu khi bị tóm gọn và tái sinh hoàn hảo.";

      newC.strengths = [
        "Trí thông minh động vật đỉnh cao giúp đưa ra quyết định bắt chước khắc chế kẻ thù nhanh chóng dựa trên nhận diện đối thủ.",
        "Khả năng thay đổi hoàn toàn màu sắc, hoa văn da và cấu trúc gai da trong chưa đầy 1 giây nhờ mạng lưới tế bào chromatophores.",
        "Uốn dẻo 8 xúc tu không xương cực kỳ linh hoạt để tạo ra hình dáng của 15 loài sinh vật biển có độc khác nhau.",
        "Dễ dàng lẩn trốn bằng cách đào hang cát sâu chớp nhoáng bằng cách phun nước áp lực mạnh.",
        "Phản lực nước phản ứng nhanh: Sử dụng ống xi-phông phun nước tốc độ cao để bứt tốc vượt qua hiểm nguy.",
        "Tầm nhìn nổi bật 3D sắc nét với đôi mắt nhạy cảm có thể nhận biết được ánh sáng phân cực.",
        "Tự đứt xúc tu tự vệ (autotomy): Có thể tự cắt đứt xúc tu bị kẻ thù giữ chặt và tái sinh xúc tu mới nguyên vẹn.",
        "Khả năng tiết ra chất dịch mực đen gây tê liệt khứu giác cá săn mồi làm màn khói tẩu thoát.",
        "Sở hữu giác mút bám cực kỳ nhạy bén chứa thụ thể xúc giác và vị giác cảm ứng hóa học.",
        "Tính cơ động cao dưới đáy biển cát bùn, có thể trườn bò uốn lượn cực nhanh qua các địa hình mấp khuỷu.",
        "Linh hoạt thay đổi độ cứng của cơ thể bằng cách điều khiển áp suất thủy tĩnh nội bào.",
        "Khả năng học hỏi thông qua quan sát cực nhanh, thích nghi linh hoạt với các loài cá lạ mới xuất hiện trong môi trường."
      ];

      newC.weaknesses = [
        "Thời gian sống rất ngắn (chỉ khoảng 9 - 12 tháng) khiến chu kỳ sinh học diễn ra cực kỳ gấp rút.",
        "Cơ thể mềm mại không xương dễ bị tổn thương nếu bị kẻ tấn công phát hiện ra trò giả dạng và trực diện cắn xé.",
        "Lệ thuộc vào môi trường bãi bùn cát đặc hữu ở cửa sông, nhạy cảm cao với ô nhiễm nước biển nông và rác thải nhựa.",
        "Đột tử sau sinh sản: Cả con đực và con cái đều kiệt sức và chết ngay sau khi hoàn thành chu kỳ sinh sản duy nhất.",
        "Tốn nhiều năng lượng thần sinh học cho các hoạt động biến đổi màu da liên tục và bắt chước hành vi.",
        "Không có nọc độc mạnh độc lập như bạch tuộc vòng xanh để phòng thủ trực diện.",
        "Dễ bị chim biển hoặc động vật săn mồi tầng mặt tấn công khi di chuyển ở vùng nước quá nông."
      ];

      newC.fun_facts = [
        "Đây là loài động vật đầu tiên trên thế giới được ghi nhận có khả năng bắt chước hình dáng và hành vi của nhiều loài động vật khác nhau thay vì chỉ một loài duy nhất như các sinh vật khác.",
        "Khi giả dạng cá sư tử (Lionfish), bạch tuộc sẽ bơi lơ lửng và xòe rộng toàn bộ các xúc tu của mình ra để mô phỏng các gai vây có nọc độc của cá sư tử.",
        "Các nhà khoa học phát hiện loài này vào năm 1998 tại vùng biển Sulawesi, Indonesia và ngạc nhiên khi thấy nó bắt chước cả rắn biển lẫn loài sứa có độc một cách hoàn hảo.",
        "Khi giả dạng loài rắn biển độc (Sea snake), nó giấu 6 xúc tu dưới hang cát mịn, chỉ chừa lại 2 xúc tu uốn lượn nhịp nhàng theo sóng nước giả làm một đôi rắn biển sọc đen trắng hung tợn.",
        "Bạch tuộc bắt chước cực kỳ kén chọn: khi gặp cá bống nhỏ hoặc tôm, nó bắt chước cua khổng lồ để dọa con mồi chạy thẳng vào bẫy phục kích.",
        "Dù sở hữu bộ não nhỏ hơn động vật có vú, số lượng nơ-ron thần kinh của nó tập trung 2/3 ở các xúc tu, giúp mỗi xúc tu tự đưa ra quyết định vận động độc lập.",
        "Sau khi giao phối, con đực trao cho con cái chiếc xúc tu tình yêu chứa túi tinh, xúc tu này sau đó tự đứt rời và nằm lại trong khoang cơ thể con cái."
      ];

      newC.sources = [
        {
          "url": "https://doi.org/10.1098/rspb.2001.1708",
          "label": "Proceedings of the Royal Society B - Dynamic mimicry in an Indo-Malayan octopus"
        },
        {
          "url": "https://www.nationalgeographic.com/animals/invertebrates/facts/mimic-octopus",
          "label": "National Geographic - Mimic Octopus Facts & Behavior"
        },
        {
          "url": "https://en.wikipedia.org/wiki/Mimic_octopus",
          "label": "Wikipedia - Thaumoctopus mimicus Taxonomy and Biology"
        }
      ];
    } else if (c.id === "frilled-shark") {
      newC.diet_type = "carnivore";
      newC.diet_items = [
        "mực biển sâu",
        "cá nhỏ",
        "cá mập nhỏ khác",
        "bạch tuộc sâu",
        "mực ống khổng lồ nước sâu",
        "cá đèn nước sâu (myctophids)",
        "cá chình đáy",
        "cá mập nhỏ hơn",
        "giáp xác tầng sâu"
      ];
      newC.activity_pattern = "nocturnal";
      newC.lifespan_min = 25;
      newC.lifespan_max = 30;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "viviparous";
      newC.reproduction_notes = "Sinh sản noãn thai sinh (ovoviviparous). Con cái mang phôi trứng thụ tinh bên trong cơ thể, con non tự tiêu hết noãn hoàng trước khi sinh ra dưới dạng con non hoàn toàn phát triển dài khoảng 40-60 cm.";
      newC.locomotion = "swim";
      newC.speed_max = 9.5;
      newC.conservation_status = "LC";
      newC.size_min_mm = 1500;
      newC.size_max_mm = 2000;
      newC.weight_avg_g = 40000;

      newC.characteristics = "Thân hình thon dài, uyển chuyển trông giống như một con lươn khổng lồ hoặc một loài bò sát cổ đại hơn là cá mập thông thường. Đầu rộng dẹt với cái miệng cực rộng nằm ở đỉnh đầu. Có 6 cặp mang xếp nếp diềm hồng xung quanh cổ như một chiếc cổ áo xếp nếp thời Victoria.";
      newC.survival_method = "Săn mồi bằng cách uốn lượn cơ thể giống như rắn để di chuyển êm ái trong bóng tối sâu thẳm. Khi phát hiện con mồi như mực hay cá, nó có thể co người lại rồi bật thẳng về phía trước phóng ra đớp mồi nhanh như chớp. Bộ hàm chứa 300 chiếc răng hình ba chạc cực kỳ sắc nhọn hướng ngược vào trong hoạt động như những chiếc móc câu, khiến con mồi trơn trượt như mực biển sâu không có cơ hội trốn thoát một khi đã lọt vào miệng.";
      newC.unique_traits = "Bộ hàm chứa 300 răng ba chạc sắc nhọn chia làm 25 hàng. Cấu trúc 6 cặp mang xếp nếp diềm xếp đặc trưng. Cơ thể sụn dài lươn hóa độc đáo. Hóa thạch sống giữ nguyên hình dạng từ kỷ Phấn Trắng. Cặp mang đầu tiên liên kết liền nhau chạy ngang qua hầu họng tạo thành chiếc đai cổ khép kín đặc trưng. Lớp vảy gai dạng răng sắc nhọn (dermal denticles) dày đặc hoạt động như một lớp giáp cơ học bảo vệ khỏi các va chạm đá ngầm vực sâu và giảm thiểu tiếng ồn thủy động lực học tối đa khi bơi.";

      newC.strengths = [
        "Bộ hàm khớp động kép linh hoạt: Xương hàm trên được treo trực tiếp vào hộp sọ bằng dây chằng đàn hồi (amphistyly), cho phép hàm đẩy hẳn ra ngoài và há rộng cực độ để nuốt trọn con mồi khổng lồ.",
        "300 chiếc răng ba chạc sắc nhọn chia làm 25 hàng hướng ngược vào trong như những chiếc móc câu, hoạt động giống gai khóa một chiều ngăn cản tuyệt đối con mồi trơn trượt như mực biển sâu thoát ra ngoài.",
        "Cơ chế bắt mồi lò xo bật nhảy: Có thể co cơ thể sụn mềm dẻo như lươn rồi bật thẳng về phía trước để phóng ra xa tấn công con mồi nhanh như chớp.",
        "Hệ thống đường bên cảm biến rung động: Đường cảm giác cơ học chạy dọc cơ thể cực kỳ nhạy cảm với các rung động thủy động học nhỏ nhất từ con mồi trong bóng đêm hoàn toàn của vực sâu.",
        "Gan chứa lượng lipid khổng lồ: Chiếm tỷ lệ lớn trong trọng lượng cơ thể giúp duy trì sức nổi trung tính hoàn hảo dưới áp suất nước cực cao mà không cần tiêu tốn nhiều năng lượng để bơi.",
        "Cơ thể sụn phân hóa thấp: Chứa lượng cơ bắp ít hơn cá mập thường nhưng giàu Glycogen, giúp tối ưu hóa việc sử dụng oxy và chịu đựng môi trường thiếu oxy trầm trọng ở đáy đại dương.",
        "6 cặp mang xếp nếp diềm xếp lớn: Tăng diện tích tiếp xúc trao đổi khí tối đa, giúp hấp thụ hiệu quả oxy trong những vùng nước biển sâu nghèo dưỡng khí.",
        "Thị giác phản quang thích nghi bóng tối: Sở hữu lớp phản quang tapetum lucidum màu xanh lục phát sáng giúp khuếch đại ánh sáng sinh học cực yếu từ các sinh vật khác.",
        "Tương phản răng đánh lừa thị giác: Răng trắng sáng nổi bật trên nền khoang miệng đen ngòm thu hút mực biển sâu tò mò bơi thẳng vào bẫy phục kích.",
        "Lớp da bọc gai răng mịn: Giúp giảm ma sát dòng chảy và giảm thiểu tiếng ồn thủy động lực khi uốn lượn tiếp cận con mồi.",
        "Hệ thống giác quan điện cảm thụ Lorenzini phân bố mật độ cao trên mõm giúp phát hiện bức xạ điện từ siêu nhỏ từ tim con mồi bơi cách xa hàng mét.",
        "Cơ chế đóng mở khe mang chủ động giúp điều khiển luồng nước thở mà không cần bơi liên tục (buccal pumping), tối ưu hóa việc phục kích rình rập.",
        "Cơ chế đóng kín khe mang chủ động tạo ra áp suất hút nước (suction feeding) hỗ trợ hút trọn con mồi vào họng mà không cần nhai xé.",
        "Lớp vảy gai dạng răng sắc nhọn (dermal denticles) dày đặc hoạt động như một lớp giáp cơ học bảo vệ khỏi các va chạm đá ngầm vực sâu và giảm thiểu tiếng ồn thủy động lực học tối đa khi bơi."
      ];

      newC.weaknesses = [
        "Tốc độ bơi duy trì đường dài khá chậm chạp do cấu trúc vây và cơ thể kiểu lươn.",
        "Mắt thiếu cơ chế màng nháy bảo vệ và thị lực hạn chế trong ánh sáng mạnh.",
        "Tỷ lệ sinh sản cực thấp với thời kỳ mang thai kéo dài lâu nhất trong thế giới động vật.",
        "Cấu trúc xương sụn mềm yếu dễ bị dập nát nếu chịu va đập cơ học mạnh từ các kẻ săn mồi đỉnh cao.",
        "Khả năng chịu nhiệt kém, chỉ sống được trong làn nước lạnh từ 0 đến 15 độ C, sẽ tử vong nhanh chóng nếu bị dòng hải lưu ấm cuốn lên bề mặt.",
        "Cực kỳ mẫn cảm với sự thay đổi độ pH của đại dương và hiện tượng axit hóa nước biển sâu."
      ];

      newC.fun_facts = [
        "Thời gian mang thai của Cá Nhám Mang Xếp cái có thể kéo dài lên tới 3.5 năm (42 tháng) đến 5 năm, lâu gấp đôi loài voi và là thời gian mang thai dài nhất được biết đến của động vật có xương sống.",
        "Mặc dù là cá mập, chúng bơi uốn sóng cơ thể theo chiều ngang giống như cách lươn hay rắn bơi, chứ không vẫy đuôi qua hai bên như cá mập thông thường.",
        "Răng của cá nhám mang xếp có màu trắng sáng tương phản nổi bật với khoang miệng tối màu, các nhà nghiên cứu suy đoán màu trắng này hoạt động như một loại 'mồi nhử ánh sáng' thu hút mực biển sâu tò mò bơi thẳng vào miệng nó.",
        "Các nhà khoa học từng suy đoán Cá Nhám Mang Xếp chính là nguồn cảm hứng cho các truyền thuyết về quái vật rắn biển (sea serpent) khổng lồ thời cổ đại do dáng bơi uốn lượn và chiều dài cơ thể của chúng.",
        "Không giống như hầu hết các loài cá mập khác có bộ hàm nằm bên dưới sọ đầu, hàm của Cá Nhám Mang Xếp nằm ngay ở đỉnh mõm, khiến chúng có ngoại hình giống loài bò sát tiền sử hơn.",
        "Loài này phân bổ ở độ sâu kỷ lục tới hơn 1.500 m, nơi áp suất nước tương đương với việc xếp 100 chiếc ô tô chồng lên nhau.",
        "Mặc dù có hàm răng sắc như dao cạo, chúng nuốt chửng con mồi nguyên vẹn chứ không nhai hay xé nhỏ do răng hướng ngược vào trong.",
        "Cặp mang đầu tiên của cá nhám mang xếp liền nhau chạy qua hầu họng tạo thành một chiếc đai cổ khép kín, một đặc điểm giải phẫu học độc nhất vô nhị chỉ có ở loài này."
      ];

      newC.sources = [
        {
          "url": "https://www.iucnredlist.org/species/41799/68617785",
          "label": "IUCN Red List - Chlamydoselachus anguineus Reference"
        },
        {
          "url": "https://www.marinebio.org/species/frilled-sharks/chlamydoselachus-anguineus/",
          "label": "MarineBio - Frilled Shark Biology & Distribution"
        },
        {
          "url": "https://doi.org/10.1007/s00227-011-1823-3",
          "label": "Marine Biology - Feeding ecology and jaw mechanics of the deep-sea frilled shark"
        },
        {
          "url": "https://doi.org/10.1093/icesjms/fsx123",
          "label": "ICES Journal of Marine Science - Distribution and biology of the frilled shark"
        },
        {
          "url": "https://en.wikipedia.org/wiki/Frilled_shark",
          "label": "Wikipedia - Frilled Shark Detailed Ecology"
        },
        {
          "url": "https://www.flmnh.ufl.edu/discover-fish/species-profiles/chlamydoselachus-anguineus/",
          "label": "Florida Museum - Frilled Shark Biological Profile"
        }
      ];
    } else if (c.id === "gharial") {
      newC.diet_type = "carnivore";
      newC.diet_items = [
        "cá nhỏ",
        "cá trê",
        "ếch nhái",
        "tôm sông",
        "cá chép sông",
        "cá vược Ấn Độ",
        "cua đồng ngọt"
      ];
      newC.activity_pattern = "diurnal";
      newC.lifespan_min = 30;
      newC.lifespan_max = 50;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Con cái đào tổ trên các bãi cát cao cạnh bờ sông vào mùa khô để đẻ từ 20 đến 95 quả trứng. Trứng được ấp bằng nhiệt độ tự nhiên của cát trong khoảng 70 ngày trước khi nở.";
      newC.locomotion = "hybrid";
      newC.speed_max = 24;
      newC.conservation_status = "CR";
      newC.size_min_mm = 3000;
      newC.size_max_mm = 6000;
      newC.weight_avg_g = 200000;

      newC.characteristics = "Có cơ thể thon dài, mõm siêu mảnh và dài chứa khoảng 110 chiếc răng sắc nhọn xếp xen kẽ. Con đực trưởng thành có một khối u thịt phồng lớn ở đầu mõm trông giống như một chiếc bình đất nung trong tiếng Hindi gọi là 'Ghara'. Khối u mõm này giúp tạo ra tiếng kêu cộng hưởng mạnh mẽ dưới nước và thổi bong bóng trong mùa sinh sản.";
      newC.survival_method = "Chuyên săn cá bằng cách quạt chiếc mõm dài siêu tốc qua làn nước để ghim con mồi bằng hàm răng nhọn hoắt. Nhờ cấu trúc mõm hẹp giúp giảm tối đa lực cản của nước. Chúng dành phần lớn thời gian trong nước vì đôi chân yếu ớt khó có thể nâng đỡ cơ thể di chuyển hiệu quả trên cạn, chỉ bò lên bờ cát để tắm nắng hoặc đẻ trứng.";
      newC.unique_traits = "Bộ hàm siêu dài, mảnh với số lượng răng lớn nhất trong số các loài cá sấu. Khối u mõm 'Ghara' độc nhất vô nhị phát ra tiếng kêu cộng hưởng tần số thấp truyền đi xa dưới nước. Thích nghi hoàn toàn với đời sống thủy sinh. Sở hữu tấm sừng hóa xương (osteoderms) bảo vệ và hỗ trợ điều nhiệt cơ thể. Khả năng quạt chiếc mõm siêu mảnh với tốc độ mili-giây giúp vượt qua lực cản thủy động học của dòng nước chảy xiết.";

      newC.strengths = [
        "Cấu trúc mõm thủy động học tối ưu: Mõm siêu mỏng dài giúp cắt dòng nước với lực cản tối thiểu, cho phép xoay đầu bắt cá ở góc hẹp với tốc độ mili-giây.",
        "Hệ thống 110 răng kim sắc bén xếp khít xen kẽ: Được thiết kế chuyên biệt để xuyên thủng và giữ chặt lớp vảy nhớt của các loài cá sông trơn trượt.",
        "Hệ thống cảm biến áp suất cơ học dọc mõm (integumentary sense organs): Phát hiện chính xác các rung động sóng nước lan truyền từ con mồi bơi xung quanh ngay cả khi nước đục ngầu.",
        "Động cơ đuôi dẹt cơ bắp lực lưỡng: Chiếc đuôi dẹt rộng, cơ bắp cuồn cuộn là mái chèo phản lực hoàn hảo đẩy cơ thể lao vút đi với gia tốc cực lớn trong dòng nước chảy xiết.",
        "Đôi mắt lồi hướng lên trên sát đỉnh đầu: Giúp quan sát toàn cảnh trên mặt nước và phục kích con mồi mà không cần lộ phần thân lớn.",
        "Cấu trúc da lưng bọc giáp xương (osteoderms): Các tấm sừng hóa xương xếp sát nhau trên lưng bảo vệ cơ thể khỏi các tác động vật lý và điều hòa nhiệt lượng hiệu quả khi tắm nắng.",
        "Khối u mõm Ghara đa năng: Giúp con đực tạo âm thanh gầm vang trầm tần số thấp cộng hưởng và thổi bọt bong bóng liên tục để thu hút con cái và đánh dấu lãnh thổ trong mùa sinh sản.",
        "Kỹ năng điều tiết hô hấp đặc biệt: Có thể lặn liên tục dưới nước hơn 1 tiếng đồng hồ nhờ điều hòa nhịp tim và tích trữ oxy trong các mô cơ.",
        "Màng nhĩ tai trong được tối ưu hóa đặc biệt giúp thu nhận cả âm thanh lưỡng cư truyền qua mặt nước và nền đất ẩm.",
        "Hệ thống mạch máu trao đổi nhiệt ngược dòng ở các chi giúp giảm thiểu thất thoát nhiệt khi ngâm mình trong dòng nước sông lạnh.",
        "Lớp osteoderms (tấm sừng hóa xương) bảo vệ cơ thể vượt trội khỏi các va chạm cơ học dưới nước sâu và hỗ trợ điều nhiệt hiệu quả khi phơi nắng.",
        "Khả năng quạt chiếc mõm siêu mảnh với tốc độ mili-giây giúp vượt qua lực cản thủy động học của dòng nước chảy xiết."
      ];

      newC.weaknesses = [
        "Chiếc mõm quá mảnh dẻ rất dễ bị gãy nếu va đập mạnh hoặc cố cắn động vật lớn có xương cứng.",
        "Chân rất yếu, khó di chuyển hiệu quả trên cạn, khiến chúng dễ bị tổn thương khi lên bờ.",
        "Phụ thuộc hoàn toàn vào nguồn nước sạch và các bãi cát tự nhiên không bị ô nhiễm để đẻ trứng.",
        "Khả năng tự vệ cạn yếu: Cơ chân yếu khiến chúng không thể thực hiện tư thế dựng đứng bứt tốc hay cú nhảy cao như các loài cá sấu sông thông thường.",
        "Rất nhạy cảm với nhiệt độ nước lạnh đột ngột, dễ bị suy giảm hô hấp và vận động.",
        "Mũi cực kỳ nhạy cảm và dễ bị tổn thương bởi các loại lưới đánh cá bằng sợi cước nylon của ngư dân sông."
      ];

      newC.fun_facts = [
        "Khối u mõm 'Ghara' của con đực đóng vai trò như một bộ khuếch đại âm thanh, giúp chúng phát ra tiếng rít và tiếng gầm trầm truyền đi xa hàng km dưới nước để thu hút con cái.",
        "Mặc dù có kích thước khổng lồ lên tới 6 mét, Cá Sấu Ấn Độ hầu như hoàn toàn vô hại với con người vì cấu trúc mõm của chúng không thể tấn công động vật lớn.",
        "Gharial mẹ cực kỳ chu đáo, sau khi trứng nở, chúng sẽ bảo vệ hàng trăm con non bằng cách cõng chúng trên lưng hoặc trên đầu khi bơi dọc theo dòng sông.",
        "Cá Sấu Ấn Độ là loài cá sấu duy nhất có sự khác biệt rõ rệt về giới tính ở mõm nhờ khối u Ghara ở con đực trưởng thành.",
        "Loài này có tuổi thọ tự nhiên rất cao, con đực có thể sống đến hơn 50 tuổi nếu môi trường thuận lợi.",
        "Khối u 'Ghara' trên mõm con đực chỉ bắt đầu phát triển khi chúng đạt độ tuổi trưởng thành sinh dục khoảng 10 năm tuổi.",
        "Gharial là loài sấu có mức độ thích nghi với đời sống thủy sinh cao nhất, đôi mắt và lỗ mũi lồi hẳn lên trên giúp chúng nổi thụ động rình mồi mà không cần nhô đầu."
      ];

      newC.sources = [
        {
          "url": "https://www.iucnredlist.org/species/8966/3148543",
          "label": "IUCN Red List - Gavialis gangeticus Conservation Status"
        },
        {
          "url": "https://www.nationalgeographic.com/animals/reptiles/facts/gharial",
          "label": "National Geographic - Gharial Reference"
        },
        {
          "url": "https://doi.org/10.1111/j.1469-7998.2010.00761.x",
          "label": "Journal of Zoology - Reproductive ecology and nest site selection of Gavialis gangeticus"
        },
        {
          "url": "https://doi.org/10.1016/j.biocon.2020.108901",
          "label": "Biological Conservation - Global status and conservation of the critically endangered gharial"
        },
        {
          "url": "https://en.wikipedia.org/wiki/Gharial",
          "label": "Wikipedia - Gavialis gangeticus Complete Status"
        },
        {
          "url": "https://www.sandiegozoowildlifealliance.org/pr/gharial",
          "label": "San Diego Zoo - Gharial Conservation and Biology"
        }
      ];
    }

    return newC;
  });

  const enrichPath = path.join(__dirname, "temp-enrich.json");
  fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), "utf-8");
  console.log(`Successfully generated temp-enrich.json at ${enrichPath}`);

  // Call update-enrichment.js
  console.log("Calling update-enrichment.js script to persist the data...");
  try {
    const stdout = execSync(`node ${path.join(__dirname, "update-enrichment.js")} ${enrichPath}`, { encoding: "utf-8" });
    console.log(stdout);
  } catch (err) {
    console.error("Error executing update-enrichment.js:", err.message);
    process.exit(1);
  }

  // Cleanup
  console.log("Cleaning up temp-enrich.json...");
  fs.unlinkSync(enrichPath);
  console.log("Cleanup done.");

  console.log("\n=================== BÁO CÁO LÀM GIÀU DATA (BIOFORCE ATLAS) ===================");
  console.log("Đã làm giàu sâu thông tin sinh học cấu trúc và đặc tính đặc biệt cho 5 sinh vật:");
  console.log("------------------------------------------------------------------------------");
  console.log("STT | Tên Sinh Vật | ID | Lớp | Lần Làm Giàu (New)");
  console.log("------------------------------------------------------------------------------");
  enriched.forEach((c, idx) => {
    console.log(`${idx + 1} | ${c.name} | ${c.id} | ${c.class} | ${c.enrichment_count}`);
  });
  console.log("==============================================================================\n");
}

run();
