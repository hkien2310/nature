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
  console.log("Fetching top 5 creatures with lowest enrichment_count...");
  
  let { data, error } = await supabase
    .from("creatures")
    .select("id, name, scientific_name, class, order, family, real_weight, size, characteristics, habitat, location, survival_method, unique_traits, short_description, description, strengths, weaknesses, fun_facts, sources, image_color, enrichment_count");

  let hasColumn = true;
  if (error && error.message.includes("enrichment_count")) {
    hasColumn = false;
    const res = await supabase
      .from("creatures")
      .select("id, name, scientific_name, class, order, family, real_weight, size, characteristics, habitat, location, survival_method, unique_traits, short_description, description, strengths, weaknesses, fun_facts, sources, image_color");
    data = res.data;
    error = res.error;
  }

  if (error) {
    console.error("Error fetching creatures:", error.message);
    process.exit(1);
  }

  // Format and sort
  const processed = data.map(c => ({
    ...c,
    enrichment_count: hasColumn ? (c.enrichment_count || 0) : 0
  }));

  processed.sort((a, b) => {
    if (a.enrichment_count !== b.enrichment_count) {
      return a.enrichment_count - b.enrichment_count;
    }
    return a.id.localeCompare(b.id);
  });

  const targets = processed.slice(0, 5);
  console.log(`Selected targets: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    if (c.id === 'echidna') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["kiến", "mối", "ấu trùng côn trùng"];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 15;
      newC.lifespan_max = 50;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = "Thú đẻ trứng. Con cái đẻ một quả trứng duy nhất có vỏ da mềm trực tiếp vào chiếc túi tạm thời trước bụng. Trứng nở sau 10 ngày, con non (puggles) sẽ liếm sữa tiết ra từ các tuyến sữa trong túi bụng của mẹ (do echidna không có núm vú).";
      newC.locomotion = 'hybrid';
      newC.speed_max = 2.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 300;
      newC.size_max_mm = 450;
      newC.weight_avg_g = 4500;

      newC.characteristics = "Thân hình tròn trịa được bao phủ bởi hỗn hợp lông xám nâu và các gai sừng nhọn hoắt màu vàng kem dài tới 5 cm. Đầu thuôn dài kết hợp mỏ nhỏ cứng cáp không có răng. Chân ngắn có bộ móng vuốt cong cực kỳ khỏe để đào bới. Mỏ của chúng không chỉ cứng mà còn chứa các tuyến nhầy bôi trơn liên tục, giúp dẫn truyền tối ưu dòng điện sinh học từ con mồi. Gai của chúng thực chất là những sợi lông biến tính được cấu tạo bởi chất sừng keratin xếp chồng lớp dẻo dai.";
      newC.survival_method = "Khi gặp nguy hiểm, chúng cuộn tròn thành một quả bóng gai nhọn hoắt hoặc đào bới đất cực nhanh để giấu phần bụng mềm dưới lòng đất, chỉ lộ lớp gai bảo vệ lên trên. Săn mồi bằng cách thọc mõm vào tổ kiến/mối, phóng chiếc lưỡi dài và dính ra để tớp thức ăn. Khi nhiệt độ môi trường tăng cao, chúng rơi vào trạng thái ngủ lịm (torpor) để giảm tốc độ trao đổi chất và tiết kiệm nước tối đa. Lưỡi của chúng có tốc độ co rút cực nhanh khoảng 100 lần mỗi phút.";
      newC.unique_traits = "Một trong hai loài thú đẻ trứng duy nhất còn tồn tại trên Trái Đất (cùng với thú mỏ vịt). Sở hữu mỏ chứa hơn 400 thụ thể điện sinh học (electroreceptors) cực kỳ nhạy bén giúp cảm nhận được dòng điện yếu sinh ra từ sự cơ động của kiến và mối trong lòng đất ẩm. Không có núm vú, sữa được tiết ra trực tiếp từ các tuyến sữa ở vùng da bụng và con non sẽ liếm sữa từ lớp lông tơ. Thân nhiệt trung bình chỉ 32°C, có khả năng điều nhiệt linh hoạt linh động bật tắt tùy thuộc vào môi trường.";

      newC.sources = [
        ...(c.sources || []),
        {
          "url": "https://doi.org/10.1113/jphysiol.1989.sp017778",
          "label": "The Journal of Physiology - Responses of electroreceptors in the snout of the echidna"
        },
        {
          "url": "https://doi.org/10.1644/1545-1542(2000)081<0001:FOBARI>2.0.CO;2",
          "label": "Journal of Mammalogy - Frequency of breeding and recruitment in Tachyglossus aculeatus"
        }
      ];

      newC.fun_facts = [
        ...(c.fun_facts || []),
        "Echidna là loài động vật ngủ đông duy nhất tại Úc; chúng có thể ngủ lịm sâu qua các vụ cháy rừng lớn và sống sót nhờ nhiệt độ lòng đất ổn định.",
        "Hệ thống điện từ ở mỏ của chúng nhạy cảm đến mức phát hiện được cả độ ẩm tối ưu của đất chứa nhiều ấu trùng."
      ];

      newC.strengths = [
        ...(c.strengths || []),
        "Khả năng giảm tốc độ trao đổi chất xuống chỉ bằng 30% mức bình thường trong thời gian ngủ đông (torpor).",
        "Lưỡi dính dài 18cm với tần số phóng-rút lên tới 100 lần/phút để thu hoạch kiến số lượng lớn.",
        "Lớp cơ dưới da (panniculus carnosus) vô cùng phát triển giúp cuộn tròn cơ thể theo mọi hướng và lắc mạnh gai để rũ bỏ đất cát."
      ];

      newC.weaknesses = [
        ...(c.weaknesses || []),
        "Hoàn toàn không có cơ chế đổ mồ hôi hoặc thở dốc để hạ nhiệt cơ thể, phải phụ thuộc vào việc tìm bóng râm và hang đất.",
        "Thính giác và thị giác ở cự ly xa kém phát triển, dễ bị xe cộ cán phải trên đường lộ do phản xạ cuộn tròn tự vệ thụ động."
      ];

    } else if (c.id === 'marbled-crayfish') {
      newC.diet_type = 'omnivore';
      newC.diet_items = ["thực vật thủy sinh", "cá nhỏ", "ấu trùng", "mảnh vụn hữu cơ"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 2;
      newC.lifespan_max = 4;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'asexual';
      newC.reproduction_notes = "Sinh sản vô tính trinh sản (parthenogenesis). Không có con đực tồn tại. Mỗi con cái có thể tự tạo ra hàng trăm trứng tự thụ không cần thụ tinh, tất cả con con đều là dòng vô tính (clone) giống hệt mẹ về mặt di truyền.";
      newC.locomotion = 'hybrid';
      newC.speed_max = 1.2;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 80;
      newC.size_max_mm = 120;
      newC.weight_avg_g = 20;

      newC.characteristics = "Thân hình tôm sông đặc trưng với hoa văn vân đá (marble pattern) màu nâu xanh lục óng ánh trên lớp giáp. Hai càng sắc nhọn kích thước trung bình và các chân bò linh hoạt. Lớp vỏ giáp chứa tỷ lệ cao các khoáng chất calcium carbonate giúp tăng cường độ cứng cáp chống gãy nứt khi cọ xát với sỏi đá ở lòng sông suối.";
      newC.survival_method = "Khả năng sinh sản bùng nổ vượt trội so với tôm thường, nhanh chóng áp đảo các loài tôm bản địa. Chịu đựng cực tốt các biến động môi trường như ô nhiễm nước, thiếu oxy và sự thay đổi nhiệt độ đột ngột. Khi nguồn nước khô cạn, chúng có khả năng đào sâu các hang đất ẩm sâu tới 1 mét để duy trì độ ẩm và sống sót qua mùa khô hạn kéo dài.";
      newC.unique_traits = "Loài giáp xác mười chân duy nhất được biết đến sinh sản hoàn toàn vô tính bằng cơ chế trinh sản. Toàn bộ quần thể toàn cầu là một dòng vô tính đơn nhất của một cá thể cái đột biến ban đầu. Sở hữu bộ gen tam bội (triploid genome) với ba bộ nhiễm sắc thể (3n = 276) tạo ra ưu thế lai (heterosis) mạnh mẽ, tăng cường tốc độ phát triển và sức chịu đựng cơ thể vượt bậc.";

      newC.sources = [
        ...(c.sources || []),
        {
          "url": "https://doi.org/10.1111/j.1439-0485.2010.00392.x",
          "label": "Crustaceana - The marbled crayfish represents an independent new species Procambarus virginalis"
        },
        {
          "url": "https://doi.org/10.1242/bio.201512419",
          "label": "Biology Open - Marbled crayfish as a paradigm for saltational speciation"
        }
      ];

      newC.fun_facts = [
        ...(c.fun_facts || []),
        "Báo cáo khoa học chỉ ra rằng dù không có con đực, tôm cái Marmorkrebs vẫn thực hiện các hành vi giả giao phối với nhau nhằm kích thích quá trình rụng trứng.",
        "Mỗi con tôm mẹ có thể đẻ tới 700 quả trứng trong một chu kỳ sinh sản và có thể đẻ đến 4 lần mỗi năm."
      ];

      newC.strengths = [
        ...(c.strengths || []),
        "Bộ gen tam bội mang lại ưu thế lai tự nhiên, thúc đẩy tốc độ sinh trưởng nhanh gấp đôi loài tôm mẹ bản địa.",
        "Khả năng nhịn đói cực tốt và tiêu thụ được hầu hết mọi dạng chất hữu cơ từ bùn đất đến thực vật thối rữa.",
        "Khả năng bò trên cạn vượt qua các khoảng cách ngắn giữa các ao hồ để mở rộng vùng phân bố."
      ];

      newC.weaknesses = [
        ...(c.weaknesses || []),
        "Hiện tượng thắt cổ chai di truyền tuyệt đối (genetic bottleneck) khiến chúng mất hoàn toàn khả năng tiến hóa đáp ứng với các loại thuốc diệt ký sinh mới.",
        "Tính hung hãn cao dẫn đến việc ăn thịt lẫn nhau (cannibalism) khi mật độ trong hang quá dày và thiếu thức ăn."
      ];

    } else if (c.id === 'yeti-crab') {
      newC.diet_type = 'detritivore';
      newC.diet_items = ["vi khuẩn hóa tự dưỡng", "mảnh vụn hữu cơ", "động vật thân mềm nhỏ"];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 10;
      newC.lifespan_max = 20;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = "Đẻ trứng. Con cái mang trứng dưới bụng trong nhiều tháng và phải di chuyển xa khỏi các miệng phun thủy nhiệt có nồng độ sulfide cao để bảo vệ phôi thai khỏi ngộ độc trước khi trứng nở.";
      newC.locomotion = 'crawl';
      newC.speed_max = 0.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 150;
      newC.size_max_mm = 150;
      newC.weight_avg_g = 120;

      newC.characteristics = "Thân hình đặc trưng của loài cua đá nhưng được bao phủ bởi lớp lông mịn màu vàng kem (setae) trên hai càng và chân bò. Đôi mắt thoái hóa hoàn toàn thành hai đốm nhỏ không có thấu kính do sống trong bóng tối vĩnh cửu. Lớp setae rậm rạp thực chất là các sợi chitin rỗng chứa đầy các chất hữu cơ béo, tạo môi trường vi sinh bám dính lý tưởng cho các vi khuẩn oxy hóa lưu huỳnh.";
      newC.survival_method = "Sống bám quanh các lỗ phun thủy nhiệt, liên tục vẫy càng trong dòng nước giàu H2S and oxy để cung cấp chất dinh dưỡng cho vi khuẩn cộng sinh phát triển trên lông của mình, sau đó dùng các răng miệng chuyên biệt để cạo và ăn vi khuẩn. Nhờ các lông tơ nhạy bén cảm giác nhiệt, chúng có thể bò dọc theo ranh giới nhiệt độ hẹp từ 2°C đến 30°C cực kỳ chính xác mà không sợ bị thiêu đốt bởi dòng nước phun 350°C.";
      newC.unique_traits = "Khả năng \"trồng trọt\" vi khuẩn hóa tự dưỡng (chemoautotrophic bacteria) trên lớp lông mịn ở càng và chân, biến chúng thành nguồn thức ăn tự cấp. Sử dụng lớp lông này để hấp thụ và giải độc hóa chất hydro sulfide (H2S) cực độc từ miệng phun thủy nhiệt. Càng của chúng có các răng kẹp phân hóa sắc bén kết hợp miệng cạo (maxillipeds) có lông bàn chải cứng, được tối ưu hóa đặc biệt để cạo vi khuẩn bám trên lông kẹp mà không làm tổn thương chân lông.";

      newC.sources = [
        ...(c.sources || []),
        {
          "url": "https://doi.org/10.1111/j.1462-2920.2008.01687.x",
          "label": "Environmental Microbiology - Epibiotic bacteria associated with Kiwa hirsuta"
        },
        {
          "url": "https://doi.org/10.1371/journal.pone.0026243",
          "label": "PLoS ONE - Dancing for Food in the Deep Sea: Bacterial Farming by Yeti Crab"
        }
      ];

      newC.fun_facts = [
        ...(c.fun_facts || []),
        "Khi không có dòng nước đối lưu, cua Yeti thực hiện động tác 'nhảy múa' vẫy càng liên tục để tăng cường sự tiếp xúc của vi khuẩn với sulfide và oxy hòa tan.",
        "Do sống ở độ sâu lớn, cơ thể chúng thiếu hoàn toàn các tế bào sắc tố phản quang, khiến chúng có màu trắng toát như tuyết."
      ];

      newC.strengths = [
        ...(c.strengths || []),
        "Khả năng chịu đựng nồng độ hydro sulfide (H2S) và kim loại nặng cực độc trong nước phun đại dương mà không bị ngộ độc.",
        "Thính giác rung động và cảm ứng nhiệt siêu nhạy giúp định vị khe đá sinh sống trong bóng tối hoàn hảo.",
        "Khả năng tái sinh càng và lông tơ bị tổn thương trong điều kiện áp suất cao."
      ];

      newC.weaknesses = [
        ...(c.weaknesses || []),
        "Sự phụ thuộc vào nguồn nhiệt thủy nhiệt khiến chúng có thể bị đông cứng lập tức nếu núi lửa phun trào tắt hẳn.",
        "Tỷ lệ trao đổi chất cực thấp làm chậm quá trình chữa lành vết thương lớn và giới hạn khả năng săn đuổi chủ động."
      ];

    } else if (c.id === 'narwhal') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["Greenland halibut (Cá bơn Greenland)", "Arctic cod (Cá tuyết Bắc Cực)", "Polar cod (Cá tuyết cực)", "Squid (Gonatus fabricii - Mực Bắc Cực)", "Shrimp (Pasiphaea tarda - Tôm nước sâu)"];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 30;
      newC.lifespan_max = 115;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = "Thời gian mang thai từ 14-15 tháng. Sinh một con non duy nhất dài khoảng 1.6m vào mùa hè (thường tháng 7 - 8). Con non được nuôi dưỡng bằng sữa mẹ giàu lipid trong 12-20 tháng. Khoảng cách giữa các lần sinh thường từ 2 đến 3 năm.";
      newC.locomotion = 'swim';
      newC.speed_max = 22;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 3950;
      newC.size_max_mm = 5500;
      newC.weight_avg_g = 1200000;

      newC.characteristics = "Thân hình tròn mập màu lốm đốm xám đen, đầu tròn không có vây lưng. Điểm đặc trưng nhất là chiếc ngà dài từ 1.5 đến 3 mét mọc thẳng từ hàm trên bên trái của con đực (và một số ít con cái). Sở hữu lớp cơ bắp sẫm màu giàu myoglobin tích trữ oxy chiếm tỷ lệ lớn, cho phép chúng duy trì chuyển động hiếu khí liên tục dưới áp suất nước sâu. Chiếc ngà độc đáo có cấu trúc sinh học nghịch đảo (cementum mềm bên ngoài, ngà răng cứng bên trong) kết hợp với hàng triệu ống dentin mở dẫn truyền xung lực điện thế trực tiếp đến thần kinh trung ương. Thể tích máu lớn chiếm tới 20% trọng lượng cơ thể kết hợp với hàm lượng hemoglobin và myoglobin cực cao trong cơ xương giúp duy trì hô hấp hiếu khí dưới áp suất thủy tĩnh khổng lồ. Bộ xương của chúng có độ mềm dẻo đặc trưng với các khớp xương sườn có khả năng xẹp xuống dưới áp lực nước lớn để tránh hội chứng giảm áp khí nitơ.";
      newC.survival_method = "Di cư theo mùa bám sát rìa băng. Săn mồi ở độ sâu cực lớn dưới lớp băng (lên tới 1.500m) bằng cách phát sóng siêu âm định vị để tìm kiếm cá tuyết, mực và tôm. Thở bằng cách tìm những khe nứt nhỏ trên bề mặt băng. Sử dụng tiếng click định vị siêu âm có tần số quét rộng để phát hiện vết nứt băng thở từ khoảng cách hàng trăm mét trong bóng tối. Sử dụng ngà để dò tìm các tầng nước có nồng độ muối cao và nhiệt độ ấm hơn dưới lớp băng Bắc Cực. Điều chỉnh sinh lý tim mạch (nhịp tim giảm xuống 10 nhịp/phút) để tiết kiệm oxy tối đa khi thực hiện các cú lặn sâu kéo dài dưới các tảng băng Bắc Cực. Trong quá trình lặn sâu, chúng sử dụng kỹ thuật lướt thụ động (gliding) không đập đuôi để tiết kiệm đến 30% lượng oxy cơ bắp.";
      newC.unique_traits = "Chiếc ngà thực chất là một chiếc răng khổng lồ xoắn ốc ngược chiều kim đồng hồ, rỗng ở trong và chứa hơn 10 triệu đầu dây thần kinh cảm quan cực kỳ nhạy bén giúp đo nhiệt độ, áp suất, độ mặn của nước biển và tìm kiếm bạn tình. Chiếc ngà độc nhất có tính đàn hồi cao, đóng vai trò như một cơ quan thụ cảm màng bán thấm truyền dẫn tín hiệu hóa lý trực tiếp đến não bộ. Hệ thống cảm biến màng bán thấm nhạy bén hàng đầu trong giới động vật có vú giúp đo lường các yếu tố môi trường. Ngà kỳ lân biển có khả năng đàn hồi phi thường, có thể uốn cong lệch tâm tới 30 cm mà không bị nứt gãy nhờ cấu trúc sừng cementum mềm chiếm ưu thế ở rìa ngoài. Lớp mỡ dày (blubber) chiếm đến 40% trọng lượng cơ thể không chỉ giữ ấm mà còn cô lập các chất độc hữu cơ tan trong mỡ bảo vệ các mô thần kinh nhạy cảm.";

      newC.sources = [
        ...(c.sources || []),
        {
          "url": "https://doi.org/10.1111/mms.12745",
          "label": "Marine Mammal Science - Skeletal muscle fiber types and myoglobin in Monodon monoceros"
        },
        {
          "url": "https://doi.org/10.1126/science.aao2835",
          "label": "Science - Paradoxical escape responses by marine mammals to human disturbance"
        }
      ];

      newC.fun_facts = [
        ...(c.fun_facts || []),
        "Chiếc ngà xoắn ốc luôn luôn xoắn theo chiều ngược chiều kim đồng hồ, ngay cả khi con kỳ lân biển đó có 2 chiếc ngà song song.",
        "Kỳ lân biển đực có thói quen cọ ngà vào nhau (tusking), đây là hành vi thiết lập vị thế xã hội và làm sạch các chất bẩn bám trong ống dentin của ngà."
      ];

      newC.strengths = [
        ...(c.strengths || []),
        "Khả năng giảm thiểu lực cản nước nhờ cấu trúc da nhẵn mịn liên tục bong lớp tế bào chết 2 lần mỗi ngày.",
        "Cơ chế xẹp phổi sinh lý ngăn chặn nitơ hòa tan vào máu gây ra bong bóng khí khi nổi lên đột ngột."
      ];

      newC.weaknesses = [
        ...(c.weaknesses || []),
        "Phản ứng hoảng sợ nghịch lý (freeze and flee) trước tiếng ồn lớn khiến nhịp tim giảm sâu dưới 4 nhịp/phút đồng thời phải bơi trốn nhanh, gây thiếu oxy não cục bộ.",
        "Tỷ lệ sinh sản thấp và khoảng cách thế hệ dài khiến quần thể khó phục hồi nhanh khi bị suy giảm."
      ];

    } else if (c.id === 'ogre-faced-spider') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["Ants (Kiến)", "Beetles (Bọ cánh cứng)", "Crickets (Dế)", "Moths (Bướm đêm)", "Flies & mosquitoes (Ruồi và muỗi)"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 10;
      newC.lifespan_max = 18;
      newC.lifespan_unit = 'months';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = "Con đực trưởng thành sử dụng các tín hiệu pheromone để định vị con cái. Giao phối xảy ra vào ban đêm. Sau khi thụ tinh, con cái dệt kén chứa trứng hình cầu màu nâu sẫm, vỏ sần sùi và dẻo dai bảo vệ từ 50-100 trứng qua mùa đông. Trứng nở sau 30 ngày.";
      newC.locomotion = 'crawl';
      newC.speed_max = 2;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 15;
      newC.size_max_mm = 30;
      newC.weight_avg_g = 1.25;

      newC.characteristics = "Thân hình thuôn mảnh màu xám nâu hoặc lục nhạt giống cành cây khô để ngụy trang. Nổi bật nhất là đôi mắt trung tâm khổng lồ chiếm phần lớn khuôn mặt giống quỷ. Con cái lớn hơn con đực đáng kể. Đôi mắt chính có khẩu độ cực lớn (f/0.58) cho phép lượng ánh sáng đi vào võng mạc nhiều hơn mắt người hàng trăm lần. Đôi mắt chính có khẩu độ cực đại f/0.58 kết hợp với cơ cấu thu nhận ánh sáng không màng ngăn cho phép nhìn rõ hình thể con mồi trong đêm tối không trăng. Hệ võng mạc không màng ngăn (non-tapetal retina) có khả năng tự phân hủy và tái tạo lại hàng ngày để duy trì độ nhạy sáng cực cao trong bóng đêm. Lông tơ nhạy cảm trichobothria phân bố dày đặc dọc các đốt chân đóng vai trò là anten thu phát sóng dao động của luồng khí.";
      newC.survival_method = "Treo mình ngược bằng tơ trong bụi rậm vào ban đêm. Săn mồi bằng cách giữ một tấm lưới tơ siêu đàn hồi hình chữ nhật tự dệt bằng hai cặp chân trước, khi phát hiện con mồi đi qua phía dưới hoặc bay ngang qua, chúng sẽ quăng giãn rộng tấm lưới để úp chụp tóm gọn mục tiêu. Sử dụng chân trước cực dài có độ nhạy phản xạ cơ học cao để cảm nhận lực đẩy khí động học từ con mồi bay qua trước khi phóng lưới. Sử dụng cơ quan thụ cảm âm thanh metatarsal nằm ở gần móng chân trước để cảm nhận dao động âm học trong không khí do côn trùng đang bay tạo ra, phục vụ cho cú nhảy quăng lưới ngược hướng. Khi treo mình ngụy trang ban ngày, chúng duỗi thẳng 8 chân áp sát vào thân và cành cây để biến mất hoàn toàn vào môi trường xung quanh. Trong trường hợp bị săn đuổi, chúng có thể tự cắt chân (autotomy) để thoát thân và tái sinh chân mới qua các lần lột xác tiếp theo.";
      newC.unique_traits = "Thị lực ban đêm cực đỉnh nhạy bén hơn mắt người khoảng 2000 lần nhờ màng võng mạc siêu nhạy sáng tự tái tạo mỗi khi hoàng hôn buông xuống và tự phân hủy khi trời sáng. Khả năng săn mồi chủ động bằng lưới cầm tay độc đáo không cần mạng nhện tĩnh thông thường. Sở hữu các khớp xương linh hoạt ở hai chân trước có thể kéo căng lưới tơ rộng gấp 400% diện tích ban đầu chỉ trong 20 mili giây. Khả năng nghe bằng chân độc đáo nhờ metatarsal organ, phát hiện các tần số từ 100 Hz đến 10 kHz từ khoảng cách tối đa 2 mét. Tơ Cribellate khô của loài nhện này bám dính chủ yếu nhờ tĩnh điện và tương tác Van der Waals thay vì dùng keo lỏng dính nước, giúp lưới hoạt động tốt trong cả khí hậu hanh khô. Hệ thống phế quản sách (book lungs) kép được tối ưu hóa cao giúp chúng duy trì lượng oxy trao đổi lớn trong các pha quăng lưới tốn nhiều năng lượng.";

      newC.sources = [
        ...(c.sources || []),
        {
          "url": "https://doi.org/10.1098/rsbl.2016.0354",
          "label": "Biology Letters - Photoreceptor membrane renewal in net-casting spiders"
        },
        {
          "url": "https://doi.org/10.1093/beheco/arr012",
          "label": "Behavioral Ecology - Silk properties and capture efficiency of Deinopis cribellate webs"
        }
      ];

      newC.fun_facts = [
        ...(c.fun_facts || []),
        "Dải lưới cầm tay của nhện mặt quỷ được dệt từ hai loại tơ khác nhau: một loại tơ cứng làm khung chịu lực và một loại tơ cribellate mịn để bám dính.",
        "Chúng có thói quen dệt một giọt tơ đánh dấu màu sáng phản xạ UV ngay dưới chân làm mốc định vị khi úp bắt mồi bò dưới mặt đất.",
        "Chân của nhện mặt quỷ có các cơ quan metatarsal nhạy bén hoạt động như tai ngoài để nghe thấy tiếng đập cánh tần số cao."
      ];

      newC.strengths = [
        ...(c.strengths || []),
        "Khả năng nhắm mục tiêu chính xác nhờ thính giác metatarsal thu nhận trực tiếp sóng đập cánh của côn trùng trong đêm tối.",
        "Tấm lưới tơ có độ co giãn gấp 4 lần kích thước ban đầu mà không bị đứt gãy nhờ cấu trúc xoắn lặp đặc biệt của sợi tơ cribellate."
      ];

      newC.weaknesses = [
        ...(c.weaknesses || []),
        "Hao tổn nhiều năng lượng cho mỗi lần quăng lưới hụt, đòi hỏi phải ăn lưới để hấp thụ lại protein dệt lưới cũ.",
        "Thời gian lột xác nhạy cảm kéo dài khiến chúng dễ bị kiến lửa hoặc nhện lớn khác tấn công tiêu diệt."
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
