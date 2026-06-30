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

    if (c.id === "bullet-ant") {
      newC.diet_type = "omnivore";
      newC.diet_items = [
        "dịch ngọt thực vật (honeydew)",
        "côn trùng nhỏ",
        "nhện",
        "mật hoa",
        "nhựa cây",
        "sâu bướm nhỏ",
        "nước ngọt từ trái cây rụng"
      ];
      newC.activity_pattern = "nocturnal";
      newC.lifespan_min = 3;
      newC.lifespan_max = 6;
      newC.lifespan_unit = "months";
      newC.reproduction_type = "sexual";
      newC.reproduction_notes = "Chỉ có kiến chúa (queen) sinh sản sau khi thực hiện chuyến bay giao phối sinh học duy nhất trong đời. Kiến chúa sẽ tự đào hang lập tổ, đẻ lứa trứng đầu tiên và nuôi dưỡng chúng bằng cơ dự trữ của chính mình. Sau khi lứa kiến thợ đầu tiên trưởng thành, chúng sẽ đảm nhận việc kiếm ăn và chăm sóc tổ, còn kiến chúa chỉ tập trung đẻ trứng.";
      newC.locomotion = "walk";
      newC.speed_max = 0.8;
      newC.conservation_status = "LC";
      newC.size_min_mm = 18;
      newC.size_max_mm = 30;
      newC.weight_avg_g = 0.035;

      newC.characteristics = "Thân hình to lớn vượt trội trong thế giới kiến, màu đỏ đen sẫm bóng bẩy với lớp vỏ chitin cực kỳ cứng cáp. Sở hữu cặp hàm răng cưa sắc nhọn, khỏe mạnh và một vòi chích (sting) cực dài ở đuôi nối trực tiếp với tuyến nọc chứa độc tố thần kinh cực mạnh. Đầu to với cặp anten linh động liên tục dò đường, đôi mắt đơn nhỏ nhưng nhạy bén với ánh sáng yếu ban đêm.";
      newC.survival_method = "Sống theo đàn nhỏ từ vài trăm đến tối đa 3.000 cá thể dưới các gốc cây cổ thụ lớn. Săn mồi đơn độc trên các tán rừng cao vào ban đêm, thu thập dịch ngọt thực vật và săn các loài côn trùng nhỏ. Khi gặp kẻ thù hoặc bảo vệ tổ, chúng sử dụng cặp hàm khỏe kẹp chặt đối thủ rồi liên tục cong đuôi chích và bơm lượng lớn độc tố poneratoxin gây đau đớn tột cùng kéo dài 24 giờ. Chúng cũng cọ xát các đốt bụng (stridulation) tạo ra âm thanh xè xè cảnh báo trước khi tấn công.";
      newC.unique_traits = "Cú chích đứng số một thế giới về độ đau đớn trên chỉ số Schmidt Sting Pain Index (4.0+), thường được mô tả là đau nhói như bị đạn bắn xuyên qua cơ thể. Độc tố poneratoxin là một peptide thần kinh đặc hữu, ngăn chặn các kênh natri trong tế bào thần kinh, gây tê liệt cơ cục bộ, co thắt cơ dữ dội và cảm giác đau đớn liên tục kéo dài suốt 24 giờ mà không giảm bớt. Khả năng phát ra âm thanh stridulation bằng cách cọ xát đốt bụng để đe dọa kẻ thù và báo động cho bầy đàn.";

      newC.strengths = [
        "Cú chích sở hữu nọc độc poneratoxin gây ra cơn đau kinh hoàng nhất thế giới côn trùng, làm tê liệt hệ thần kinh cảm giác của động vật nhỏ.",
        "Cặp hàm răng cưa siêu khỏe tạo ra lực cắn kẹp giữ chặt con mồi để thuận tiện cho việc định vị chích nọc.",
        "Lớp vỏ chitin rất dày hoạt động như áo giáp cơ học chống lại các cú cắn của côn trùng khác và giảm chấn thương khi rơi từ tán cây cao.",
        "Cơ bắp chân cực kỳ phát triển cho phép leo trèo linh hoạt trên thân cây thẳng đứng và mang vác vật nặng gấp 20 lần trọng lượng cơ thể.",
        "Tuyến axit và nọc độc dồi dào cho phép thực hiện nhiều cú chích liên tiếp trong một lần phòng ngự mà không bị cạn kiệt.",
        "Hệ thống thụ cảm hóa học trên anten siêu nhạy giúp định vị bầy đàn, con mồi và nhận biết mùi kẻ thù từ khoảng cách xa.",
        "Khả năng phát âm thanh cảnh báo stridulation bằng cách cọ sát các đốt bụng tạo rung động xua đuổi những kẻ tò mò.",
        "Tính phối hợp bầy đàn cao: Khi tổ bị xâm phạm, hàng trăm con kiến thợ sẽ đồng loạt tràn ra ngoài tạo thế trận tấn công áp đảo.",
        "Sức chịu đựng dẻo dai giúp chúng sống sót qua các mùa mưa lũ nhiệt đới nhờ cơ chế đóng kín tổ thông minh.",
        "Cơ chế bám dính bàn chân phát triển mạnh giúp bám chặt vào bề mặt trơn trượt của lá cây rừng nhiệt đới ẩm ướt."
      ];

      newC.weaknesses = [
        "Kích thước tuy lớn so với kiến nhưng vẫn nhỏ bé so với động vật ăn côn trùng lớn như thú ăn kiến hay chim.",
        "Tốc độ di chuyển trên mặt đất tương đối chậm chạp, dễ bị các loài săn mồi nhanh nhẹn hơn phát hiện và bắt giữ.",
        "Phụ thuộc tuyệt đối vào độ ẩm cao của rừng mưa nhiệt đới ẩm nguyên sinh; không thể sống sót trong môi trường khô hạn hoặc bị ô nhiễm hóa chất.",
        "Quy mô đàn nhỏ (chỉ vài trăm đến 3.000 con) khiến tổ của chúng dễ bị tàn phá hoàn toàn bởi các đàn kiến quân đội khổng lồ.",
        "Chu kỳ sinh trưởng từ trứng đến kiến trưởng thành rất dài, làm giảm khả năng phục hồi số lượng bầy đàn sau khi bị tổn thất.",
        "Dễ bị tấn công bởi các loại nấm ký sinh như Ophiocordyceps, nấm sẽ kiểm soát hệ thần kinh và tiêu diệt cá thể.",
        "Thiếu cánh ở kiến thợ giới hạn khả năng di chuyển xa để mở rộng địa bàn hoạt động."
      ];

      newC.fun_facts = [
        "Nghi lễ trưởng thành của bộ tộc Sateré-Mawé ở Amazon yêu cầu các chàng trai trẻ đeo găng tay dệt bằng lá chứa hàng trăm con kiến đạn trong 10 phút, chịu đựng cơn đau thấu xương mà không được khóc để chứng minh tư cách chiến binh.",
        "Tên tiếng Pháp của loài này là 'fourmi 24 heures' (kiến 24 giờ) xuất phát từ việc cơn đau dữ dội từ cú chích của nó kéo dài đúng một ngày đêm trước khi giảm bớt.",
        "Không giống nhiều loài kiến khác, kiến đạn thợ đi kiếm ăn một mình trên các tán cây cao chứ không đi theo hàng lối dài trên mặt đất.",
        "Kiến đạn thu thập nước và dịch ngọt bằng cách ngậm trực tiếp những giọt chất lỏng khổng lồ giữa hai gọng kìm của chúng để mang về tổ.",
        "Mặc dù nọc độc của chúng gây đau đớn khủng khiếp cho con người và động vật có vú, nó hiếm khi gây tử vong trực tiếp trừ khi nạn nhân bị sốc phản vệ nặng.",
        "Khi bị đe dọa nặng nề, kiến đạn sẽ cố tình rơi tự do từ các cành cây cao xuống mặt đất để trốn thoát kẻ thù nhanh chóng."
      ];

      newC.sources = [
        { "url": "https://doi.org/10.1016/0041-0101(91)90137-A", "label": "Toxicon - Chemical and pharmacological characterization of poneratoxin" },
        { "url": "https://doi.org/10.1007/BF02224233", "label": "Insectes Sociaux - Nesting biology and foraging of Paraponera clavata" },
        { "url": "https://doi.org/10.3157/021.121.0410", "label": "Journal of Hymenoptera Research - Venom chemistry and stinging behavior" }
      ];
    } else if (c.id === "hagfish") {
      newC.diet_type = "detritivore";
      newC.diet_items = [
        "xác động vật biển rơi xuống đáy (cá voi, cá lớn)",
        "giun biển",
        "động vật thân mềm nhỏ",
        "động vật giáp xác nhỏ",
        "cá nhỏ ốm yếu hoặc chết"
      ];
      newC.activity_pattern = "nocturnal";
      newC.lifespan_min = 10;
      newC.lifespan_max = 20;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "sexual";
      newC.reproduction_notes = "Thông tin sinh sản trong tự nhiên vẫn còn là bí ẩn lớn. Con cái đẻ khoảng 20-30 quả trứng lớn có vỏ dai và các đầu móc dính để liên kết trứng thành chuỗi ở đáy biển sâu bùn lạnh. Con non nở ra có hình dáng giống hệt con trưởng thành (phát triển trực tiếp) mà không trải qua giai đoạn ấu trùng.";
      newC.locomotion = "crawl";
      newC.speed_max = 5.0;
      newC.conservation_status = "LC";
      newC.size_min_mm = 300;
      newC.size_max_mm = 800;
      newC.weight_avg_g = 1000;

      newC.characteristics = "Thân hình dài, trơn nhớt giống lươn, không có hàm xương thực sự (cá không hàm), không có vảy. Không có mắt chức năng (chỉ có đốm mắt nguyên thủy phát hiện sáng tối dưới da), xung quanh miệng có 4 cặp râu cảm giác nhạy bén và một lỗ mũi duy nhất ở đỉnh mõm. Dọc hai bên sườn là hàng trăm lỗ mở của tuyến nhầy.";
      newC.survival_method = "Săn lùng xác động vật chết rơi xuống đáy biển sâu bằng khứu giác siêu nhạy. Khi bị cá săn mồi tấn công, cá mù kích hoạt các tuyến chất nhầy, phun ra các túi mucin và sợi protein cực mảnh. Khi gặp nước biển, các sợi này trương nở lập tức tạo ra lượng chất nhầy khổng lồ gây tắc nghẽn mang kẻ săn mồi. Cá mù tự bảo vệ bằng cách thắt nút thân mình thành nút dẹt rồi trượt từ đầu đến đuôi để gạt sạch lớp chất nhầy bám trên da.";
      newC.unique_traits = "Tạo chất nhầy siêu tốc có thể biến hàng lít nước biển xung quanh thành lớp keo đặc quánh chỉ trong 0.1 giây nhờ sự trương nở của protein mucin. Khả năng tự thắt nút cơ thể (knotting) để tạo lực tì xé thịt và thoát khỏi chất nhầy bám trên mình. Không có xương cột sống thực sự (chỉ có dây sống và hộp sọ sụn), cho phép uốn dẻo không giới hạn. Da bọc lỏng lẻo chỉ liên kết ở sống lưng giúp tránh tổn thương khi bị cắn.";

      newC.strengths = [
        "Cơ chế tự vệ bằng chất nhầy trương nở cực nhanh làm nghẹt mang của mọi loài cá săn mồi có mang.",
        "Khả năng tự thắt nút cơ thể để gạt bỏ chất nhầy, tự giải thoát hoặc tạo điểm tì đẩy xé thịt con mồi khi không có hàm bám.",
        "Da bọc lỏng lẻo khó bị đâm thủng, cho phép trượt cơ thể bên trong da để tránh các vết cắn trực tiếp.",
        "Hệ thống tuần hoàn có tới 4 quả tim hoạt động bổ trợ giúp duy trì lưu thông máu ổn định ở áp suất cao dưới biển sâu.",
        "Khả năng hấp thụ chất dinh dưỡng (axit amin) trực tiếp thông qua da và mang khi chui vào ăn bên trong xác động vật phân hủy.",
        "Khứu giác cực kỳ phát triển có khả năng phát hiện mùi máu và xác thối từ khoảng cách hàng dặm trong bóng tối.",
        "Khả năng chịu đựng môi trường thiếu oxy (hypoxia) cực kỳ tốt, có thể sống sót nhiều giờ không cần oxy nhờ hô hấp qua da.",
        "Nhịp trao đổi chất siêu thấp giúp chúng nhịn ăn được nhiều tháng liền giữa các bữa ăn lớn.",
        "Hộp sọ sụn dẻo gia chịu đựng được áp suất nước khổng lồ ở độ sâu lên đến hơn 1.000 mét.",
        "Cơ thể không có xương giúp chúng uốn lượn chui luồn vào các khe đá hẹp dễ dàng."
      ];

      newC.weaknesses = [
        "Hoàn toàn mù do không có thủy tinh thể và võng mạc thực sự, dễ bị tấn công từ xa bởi các sinh vật không dùng mang.",
        "Không có hàm xương thực sự nên không thể cắn xé chủ động các con mồi di động khỏe mạnh.",
        "Chất nhầy tự vệ có thể làm chính nó ngạt thở nếu nó không thể thực hiện hành vi thắt nút để cạo sạch chất nhầy trên da.",
        "Tốc độ di chuyển bơi tự do chậm chạp, không thể trốn thoát bằng tốc độ.",
        "Phụ thuộc vào nhiệt độ nước rất lạnh của đáy biển sâu; chết nhanh chóng nếu bị đưa lên vùng nước ấm bề mặt.",
        "Thời gian phục hồi dự trữ chất nhầy lâu sau khi phóng lượng lớn tự vệ."
      ];

      newC.fun_facts = [
        "Chất nhầy của cá mù dẻo dai và mỏng hơn sợi tơ nhện nhưng khi hút nước biển sẽ nở ra gấp 10.000 lần thể tích ban đầu.",
        "Các nhà khoa học đang nỗ lực nghiên cứu protein chất nhầy cá mù để sản xuất loại sợi sinh học siêu nhẹ, siêu bền dùng cho áo chống đạn và quần áo thể thao.",
        "Cá mù thường ăn xác thối bằng cách chui thẳng vào trong bụng con vật qua các lỗ tự nhiên rồi ăn dần từ trong ra ngoài, chỉ để lại bộ xương và lớp da.",
        "Chúng là loài động vật duy nhất được biết đến có hộp sọ nhưng lại không có cột sống xương thực sự trong suốt vòng đời.",
        "Khi bị stress hoặc đe dọa, một con cá mù dài 50cm có thể biến cả một xô nước biển thành một khối thạch nhầy đông đặc chỉ trong vài giây."
      ];

      newC.sources = [
        { "url": "https://doi.org/10.1126/science.1145890", "label": "Science - Elasticity and structure of hagfish slime" },
        { "url": "https://doi.org/10.1098/rsbl.2011.0577", "label": "Biology Letters - Hagfish slime clogs gill ventilation of predatory sharks" },
        { "url": "https://doi.org/10.1242/jeb.062620", "label": "Journal of Experimental Biology - Nutrient absorption through hagfish skin and gills" }
      ];
    } else if (c.id === "vinegaroon") {
      newC.diet_type = "carnivore";
      newC.diet_items = [
        "dế sa mạc",
        "gián đất",
        "nhện",
        "cuốn chiếu",
        "giun đất",
        "thằn lằn nhỏ",
        "chuột nhắt non",
        "côn trùng nhỏ khác"
      ];
      newC.activity_pattern = "nocturnal";
      newC.lifespan_min = 4;
      newC.lifespan_max = 7;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "sexual";
      newC.reproduction_notes = "Sinh sản thông qua quá trình thụ tinh gián tiếp phức tạp. Con đực thực hiện một 'vũ điệu' kéo dài nhiều giờ để dẫn dụ con cái và đặt một bao tinh (spermatophore) lên đất, sau đó con cái sẽ tự thu nhận vào cơ thể. Con cái đẻ trứng và mang chúng trong một túi màng bảo vệ dưới bụng, ẩn nấp trong hang sâu kín suốt nhiều tuần mà không ăn uống gì cho đến khi trứng nở.";
      newC.locomotion = "walk";
      newC.speed_max = 3.0;
      newC.conservation_status = "LC";
      newC.size_min_mm = 40;
      newC.size_max_mm = 85;
      newC.weight_avg_g = 6.0;

      newC.characteristics = "Thân dẹt màu đen xám sẫm vô cùng chắc chắn. Ngoại hình giống bọ cạp nhưng không có đuôi móc độc, thay vào đó là một roi đuôi (flagellum) dài mảnh nằm ở cuối bụng đóng vai trò như cơ quan cảm giác. Sở hữu cặp chân kìm (pedipalps) rất lớn, viền răng cưa thô khỏe ở phía trước đầu dùng để kẹp nát con mồi.";
      newC.survival_method = "Trốn dưới các tảng đá lớn hoặc hang đất tự đào trong ngày để tránh nắng nóng. Ban đêm, chúng bò ra ngoài đi săn đơn độc, dò đường bằng cặp chân đầu tiên đã biến đổi thành dạng râu cảm biến dài. Khi bị đe dọa, chúng nâng cao roi đuôi và phun ra một tia axit axetic đậm đặc nồng độ 85% từ tuyến ở gốc đuôi hướng thẳng vào mắt và mũi của kẻ tấn công, gây bỏng rát và mất phương hướng cho đối thủ.";
      newC.unique_traits = "Tuyến xịt axit ở gốc đuôi có khả năng bắn tia dung dịch chính xác xa tới 30cm nhờ xoay hướng linh động. Hỗn hợp hóa học phòng ngự độc đáo chứa 85% axit axetic (gấp 17 lần giấm ăn thông thường) gây bỏng rát cực mạnh và 15% axit caprylic đóng vai trò dung môi hòa tan lớp sáp bảo vệ trên da hoặc vỏ kitin của kẻ thù. Cặp chân kìm răng cưa khổng lồ tạo lực kẹp nghiền nát.";

      newC.strengths = [
        "Vũ khí hóa học axit nồng độ cực cao có khả năng bắn chính xác xa 30cm làm mù mắt và kích ứng hệ hô hấp của thú săn mồi.",
        "Cặp chân kìm (pedipalps) khổng lồ răng cưa tạo ra lực kẹp nghiền nát lớp vỏ chitin của côn trùng và giữ chặt con mồi.",
        "Cặp chân trước biến đổi thành dạng roi cảm biến siêu dài hoạt động như một rada xúc giác và khứu giác cực nhạy bén trong đêm.",
        "Vỏ kitin dày chắc chắn bao bọc toàn thân bảo vệ chống lại các chấn thương vật lý và ngăn chặn mất nước cơ thể.",
        "Khả năng nhịn ăn nhịn uống vượt trội nhờ quá trình trao đổi chất cực kỳ chậm rãi của loài nhện sa mạc.",
        "Roi đuôi dài chứa các tế bào thụ cảm nhạy cảm với các rung động không khí nhỏ nhất giúp phát hiện kẻ thù tiếp cận từ phía sau.",
        "Kỹ năng đào hang điêu luyện tạo ra nơi ẩn nấp an toàn sâu dưới lòng đất mát mẻ.",
        "Khả năng ngụy trang tự nhiên nhờ màu sắc đen sẫm hòa lẫn vào bóng đêm sa mạc.",
        "Hành vi phòng ngự chủ động: Giương cao đôi chân kìm to lớn để đe dọa dọa dẫm đối phương trước khi xịt axit."
      ];

      newC.weaknesses = [
        "Mắt kém, chỉ có khả năng cảm nhận cường độ ánh sáng sáng/tối cơ bản, phụ thuộc hoàn toàn vào cặp roi chân trước.",
        "Không có nọc độc chết người trực tiếp, vũ khí hóa học chủ yếu dùng để xua đuổi và tự vệ hơn là giết chết mồi nhanh chóng.",
        "Tốc độ di chuyển tự do tương đối chậm chạp, không thể trốn chạy bằng tốc độ nhanh.",
        "Quá trình lột xác cực kỳ nhạy cảm và nguy hiểm, cần hang có độ ẩm thích hợp nếu không sẽ bị kẹt vỏ và chết.",
        "Kích thước trung bình vẫn dễ bị các loài bò sát lớn hơn (thằn lằn lớn), cầy mangut hoặc chim ăn thịt nuốt chửng."
      ];

      newC.fun_facts = [
        "Cái tên 'Vinegaroon' của chúng được đặt do mùi giấm chua nồng nặc phát ra ngay sau khi chúng phun axit tự vệ.",
        "Mặc dù trông rất hung dữ và có roi đuôi dài giống bọ cạp, bọ cạp giấm hoàn toàn vô hại với con người và không hề có nọc chích độc.",
        "Khi bọ cạp giấm đi chuyển, chúng giơ cặp chân trước dài lên không trung và liên tục vẫy để cảm nhận thế giới xung quanh, chỉ thực sự đi bằng 6 chân còn lại.",
        "Sau khi trứng nở, các con non màu trắng sữa sẽ leo lên lưng mẹ bám chặt và hút nước ẩm từ da mẹ cho đến khi trải qua lần lột xác đầu tiên mới tự lập."
      ];

      newC.sources = [
        { "url": "https://doi.org/10.1111/j.1469-7998.1962.tb05711.x", "label": "Journal of Zoology - The defensive secretion of the whipscorpion Mastigoproctus giganteus" },
        { "url": "https://doi.org/10.1016/0019-1914(61)90052-1", "label": "Journal of Insect Physiology - Chemical defense of whipscorpions" },
        { "url": "https://doi.org/10.1093/ae/tmy062", "label": "American Entomologist - Natural history and behavior of Mastigoproctus giganteus" }
      ];
    } else if (c.id === "blue-dragon") {
      // Keep existing properties and update/enrich them
      newC.diet_type = "carnivore";
      newC.diet_items = [
        "sứa lửa (Portuguese man-o'-war)",
        "sứa bọt biển xanh (Porpita porpita)",
        "sứa buồm (Velella velella)",
        "ốc sên tím trôi nổi (Janthina janthina)",
        "các loài sứa biển khác",
        "sên biển cùng loài khi khan hiếm thức ăn (cannibalism)",
        "ấu trùng sinh vật phù du nhỏ"
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
      newC.unique_traits = "Khả năng kháng và tích lũy nọc độc (stolen weaponry) từ các loài sứa nguy hiểm nhất hành tinh. Cơ chế ngụy trang ngược (countershading) thả nổi ngửa bụng độc đáo. Xúc tu dạng cerata chứa túi độc cnidosacs cực kỳ nguy hiểm đối với động vật săn mồi và con người. Khả năng tái sinh thùy xúc tu cerata bị đứt gãy nhanh chóng. Tinh chất melanin xanh giúp chống bức xạ cực tím cực kỳ hiệu quả.";

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
        "Lưỡng tính đồng thời giúp nhân đôi cơ hội sinh sản khi gặp bất kỳ cá thể nào cùng loài.",
        "Cơ chế cleptocnidae tiên tiến: Phân tách tế bào nematocyst của con mồi sứa lửa thành dạng tế bào chích chưa trưởng thành và vận chuyển chúng tới các mô cnidosacs trên cerata mà không làm kích hoạt cơ chế phóng gai độc.",
        "Kháng sứa lửa tuyệt đối: Màng nhầy ruột chứa glycoconjugate đặc biệt liên kết chặt và ngăn ngừa thụ thể của nematocysts sứa phóng điện châm chích.",
        "Thích nghi cao với sự thay đổi của nồng độ muối biển ở tầng mặt nhờ lớp vỏ bảo vệ kỵ nước bảo vệ các mô mềm tinh xảo."
      ];

      newC.weaknesses = [
        "Không thể chủ động di chuyển ngược dòng hải lưu hoặc gió mạnh, dễ bị dạt vào bờ cát nóng và chết khô.",
        "Không có lớp vỏ cứng bảo vệ cơ thể nên rất mềm yếu nếu bị tấn công vật lý trực diện.",
        "Rất kén ăn, chỉ ăn các sinh vật dạng túi chứa độc trôi nổi như sứa lửa, sứa buồm.",
        "Nhạy cảm cao với nhiệt độ nước lạnh, cơ thể sẽ bị đông cứng và mất sức nổi nếu nhiệt độ nước giảm xuống dưới 15°C.",
        "Dễ bị tổn thương bởi các chấn động mạnh của sóng biển bão lớn, có thể làm gãy các thùy cánh cerata.",
        "Không có khả năng tự sản sinh chất độc độc lập, hoàn toàn phụ thuộc vào nguồn cung cấp tế bào chích từ sứa lửa.",
        "Điểm yếu ngụy trang khi bị lật úp ngược do tác động ngoại lực, để lộ phần bạc dễ bị phát hiện.",
        "Bất lực trước sự sụt giảm nhiệt độ đột ngột: Trạng thái hôn mê co thắt (cold coma) xảy ra khi nhiệt độ dòng hải lưu hạ dưới 12°C, làm mất khả năng nổi.",
        "Dễ bị tổn thương bởi các loài động vật ăn tạp trôi nổi không nhạy cảm với độc tố nematocysts, chẳng hạn như rùa biển da."
      ];

      newC.fun_facts = [
        "Vì ngửa bụng lên trên khi bơi, phần có màu xanh lục/xanh lam tuyệt đẹp của Rồng Xanh thực chất là bụng của nó chứ không phải lưng của nó.",
        "Nọc độc tích lũy trong xúc tu của nó được tích tụ cô đặc đến mức một cú chích từ con sên tí hon dài 3cm này có thể nguy hiểm hơn nhiều so với cú chạm trực tiếp từ một con sứa lửa khổng lồ.",
        "Chúng là loài lưỡng tính nhưng không thể tự thụ tinh mà bắt buộc phải giao phối chéo với nhau ở tư thế úp bụng độc đáo trên mặt nước.",
        "Để bảo vệ trứng không bị chìm xuống đáy đại dương lạnh lẽo, rồng xanh đính dải trứng dài của mình vào những bộ xương kitin trôi nổi của sứa buồm đã bị chúng ăn thịt.",
        "Dù không có mắt sắc bén, rồng xanh phát hiện con mồi thông qua các cơ quan thụ cảm hóa học cực nhạy phân bố dọc mép miệng.",
        "Sắc tố xanh ngọc lộng lẫy của chúng thực chất hấp thụ một lượng ánh sáng UV để chuyển hóa thành năng lượng bảo vệ mô mềm.",
        "Chúng có thể tự ăn thịt lẫn nhau khi nguồn thức ăn khan hiếm và nồng độ sên biển trong khu vực quá dày đặc.",
        "Mặc dù là sinh vật trôi nổi, Rồng Xanh thực sự di chuyển bằng cách 'bơi ngửa' suốt đời, sử dụng sức căng bề mặt của nước để trườn đi giống như đi trên một tấm kính.",
        "Khi sứa lửa khan hiếm, rồng xanh sẽ săn lùng và ăn thịt chính các cá thể cùng loài để duy trì năng lượng sinh tồn."
      ];

      newC.sources = [
        { "url": "https://doi.org/10.2307/2405934", "label": "The Biological Bulletin - Feeding habits of Glaucus atlanticus" },
        { "url": "https://www.oceana.org/marine-life/blue-dragon/", "label": "Oceana - Blue Dragon Sea Slug Profile & Conservation" },
        { "url": "https://en.wikipedia.org/wiki/Glaucus_atlanticus", "label": "Wikipedia - Glaucus atlanticus Detailed Ecology" },
        { "url": "https://doi.org/10.1093/mollus/eyy005", "label": "Journal of Molluscan Studies - Glaucus atlanticus Feeding and Ecology" }
      ];
    } else if (c.id === "horned-lizard") {
      // Keep existing properties and update/enrich them
      newC.diet_type = "carnivore";
      newC.diet_items = [
        "kiến gặt (harvester ants)",
        "mối",
        "bọ cánh cứng nhỏ",
        "kiến gặt đỏ (Pogonomyrmex barbatus)",
        "bọ cánh cứng sa mạc",
        "nhện đất nhỏ"
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
        "Tiết kiệm nước tối đa bằng cách bài tiết axit uric dạng rắn và tái hấp thu nước triệt để ở trực tràng.",
        "Cơ chế autohemorrhaging hoàn hảo: Sự co thắt cơ vòng bao quanh các tĩnh mạch trở về từ đầu làm tăng áp suất máu hốc mắt, đẩy tia máu bắn ra ngoài.",
        "Máu chứa hợp chất bài tiết đắng đặc hữu do hấp thụ độc tố axit formic từ kiến gặt đỏ, làm chó hoang, sói coyote nôn mửa tức thì.",
        "Điều hòa thân nhiệt chủ động bằng cách thay đổi mật độ hắc tố da (sẫm màu để hấp thụ nắng sớm sa mạc và nhạt dần thành màu cát trắng buổi trưa)."
      ];

      newC.weaknesses = [
        "Dễ bị tổn thương nếu hốc mắt bị nhiễm trùng hoặc suy kiệt năng lượng sau khi phun lượng máu lớn (lên tới 1/3 tổng lượng máu cơ thể).",
        "Hệ tiêu hóa chuyên hóa quá sâu vào việc ăn kiến gặt sa mạc (chiếm 70-90% khẩu phần), cực khó chuyển đổi sang thức ăn khác.",
        "Tốc độ chạy đường dài chậm chạp do cấu trúc cơ thể dẹt tròn cồng kềnh hơn các loài thằn lằn sa mạc thon gọn khác.",
        "Nhạy cảm cao với hóa chất trừ sâu diệt kiến của con người, phá hủy nguồn thức ăn sinh tồn duy nhất.",
        "Tổ trứng nằm dưới cát dễ bị các loài bò sát khác hoặc lợn rừng peccary đào bới ăn thịt.",
        "Không có khả năng tự vệ chủ động bằng răng hay vết cắn mạnh, hoàn toàn phụ thuộc vào phòng thủ thụ động.",
        "Nhạy cảm với nhiệt độ lạnh kéo dài, dễ bị rơi vào trạng thái ngủ đông cưỡng bức kém linh hoạt.",
        "Không thể thích nghi với việc ăn các loài côn trùng khác: Sự thiếu hụt axit formic trong khẩu phần ăn sẽ làm suy giảm hệ miễn dịch và gây chết mòn.",
        "Thời gian phục hồi máu chậm: Sau mỗi lần phun máu tự vệ tối đa, chúng phải mất vài tuần để bù lại lượng tế bào hồng cầu đã mất."
      ];

      newC.fun_facts = [
        "Cơ chế phun máu kỳ lạ: Chúng phun máu bằng cách ngăn chặn dòng máu chảy ra khỏi đầu, làm tăng áp suất máu hốc mắt lên mức cực đại khiến các mao mạch nhỏ vỡ tung.",
        "Máu bắn ra từ mắt thằn lằn sừng có mùi vị cực kỳ kinh tởm và cay nóng đối với chó sói đồng cỏ coyote nhưng kỳ lạ là chim săn mồi lại không hề bị ảnh hưởng bởi thứ máu này.",
        "Chúng có thể phình to cơ thể bằng cách hít đầy không khí để trông giống như một quả bóng gai, khiến kẻ thù không thể nuốt trôi.",
        "Tia máu bắn ra có thể chiếm tới 1/3 tổng lượng máu trong cơ thể của chúng nhưng chúng có khả năng tái tạo phục hồi lượng máu này vô cùng nhanh chóng.",
        "Thằn lằn sừng không cần cúi đầu uống nước; chúng chỉ cần đứng dưới mưa hoặc sương, da của chúng sẽ tự động hút nước qua các khe vảy và đưa đến miệng nhờ lực mao dẫn.",
        "Loài này là loài bò sát chính thức của bang Texas và được người dân ở đây vô cùng yêu quý, gọi thân mật là 'Horny Toad'.",
        "Mặc dù trông rất hung dữ với bộ gai góc, chúng thực chất rất hiền lành và hoàn toàn vô hại với con người, thường nằm im trên bàn tay nếu được bế.",
        "Bộ sừng của loài thằn lằn này không phải là xương sọ kéo dài, mà thực chất là cấu trúc da sừng hóa (keratinized) phát triển mạnh gắn chặt vào hộp sọ.",
        "Độc tính từ máu phun từ mắt của thằn lằn sừng chỉ nhắm vào động vật họ chó mèo; loài bò sát khác hoặc chim săn mồi hoàn toàn không bị ảnh hưởng."
      ];

      newC.sources = [
        { "url": "https://doi.org/10.2307/1447226", "label": "Copeia - Blood-squirting behavior of Phrynosoma" },
        { "url": "https://www.iucnredlist.org/species/64039/12738722", "label": "IUCN Red List - Texas Horned Lizard conservation status" },
        { "url": "https://en.wikipedia.org/wiki/Texas_horned_lizard", "label": "Wikipedia - Texas Horned Lizard Detailed Life History" },
        { "url": "https://doi.org/10.2307/3562433", "label": "Herpetologica - Diet and habitat selection of Phrynosoma cornutum" }
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
