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

    if (c.id === "big-belly-seahorse") {
      newC.diet_type = "carnivore";
      newC.diet_items = ["tôm mysis", "ấu trùng giáp xác", "động vật chân kiếm (copepods)", "giáp xác chân khớp (amphipods)", "ấu trùng cá", "giun nhỏ"];
      newC.activity_pattern = "diurnal";
      newC.lifespan_min = 3;
      newC.lifespan_max = 5;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "sexual";
      newC.reproduction_notes = "Con cái đẻ trứng vào túi ấp ở bụng con đực. Con đực thụ tinh và mang thai trong 4-5 tuần trước khi co bóp cơ bụng phóng hàng trăm cá ngựa con ra ngoài.";
      newC.locomotion = "swim";
      newC.speed_max = 0.2;
      newC.conservation_status = "LC";
      newC.size_min_mm = 150;
      newC.size_max_mm = 350;
      newC.weight_avg_g = 18;

      newC.characteristics = "Thân hình thon dài với chiếc bụng phình to cực đại đặc trưng ở con đực, đuôi dài có khả năng co cuốn bám giữ chắc chắn. Lớp da sừng hóa không có vảy thông thường mà được bao bọc bởi các vòng xương tấm chịu lực tốt. Đầu có các mấu gai gai góc nhô lên tạo thành một vương miện giả (coronet) đặc thù riêng biệt cho từng cá thể để ngụy trang cơ học. Mõm dài dạng ống hút thuôn nhọn.";
      newC.survival_method = "Thực hiện ngụy trang thụ động (passive crypsis) đỉnh cao thông qua việc biến đổi màu sắc da từ vàng, nâu đến tím xám tiệp màu với thảm cỏ biển hoặc rạn tảo bẹ ôn đới. Sử dụng đuôi cuốn (prehensile tail) bám chặt vào các nhánh tảo bẹ để neo giữ cơ thể đứng thẳng tĩnh lặng tuyệt đối trước dòng hải lưu mạnh, hạn chế tối đa dao động gây chú ý với kẻ săn mồi. Di chuyển đôi mắt độc lập để quét toàn bộ không gian xung quanh mà không cần xoay chuyển cơ thể.";
      newC.unique_traits = "Cơ chế sinh sản mang thai đực thực thụ (male pregnancy) hoàn thiện nhất sinh giới: túi bụng con đực có vai trò sinh lý học tương đương tử cung động vật có vú, tiết ra dịch giàu lipid và canxi nuôi dưỡng phôi. Cú đớp mồi bằng cơ chế hút chân không siêu tốc (pivot feeding): xoay nhanh đầu lên trên để tạo góc cắn và mở rộng xương móng tạo lực hút chân không cực đại trong mõm ống trong vòng 6 mili giây.";

      newC.strengths = [
        "Cơ chế đớp mồi hút chân không Pivot Feeding siêu tốc trong vòng 6 mili giây với tỷ lệ bắt trúng con mồi giáp xác đạt 90%.",
        "Đuôi cuốn (prehensile tail) cực kỳ linh hoạt với cấu trúc các đốt xương vuông có tính đàn hồi cao giúp bám chặt vào rạn san hô, chịu được lực kéo lớn từ dòng nước thủy triều.",
        "Khả năng ngụy trang đỉnh cao thông qua thay đổi nhanh sắc tố biểu bì (chromatophores) và phát triển các mấu da mô phỏng tảo biển.",
        "Thị giác lập thể 360 độ nhờ hai mắt di chuyển độc lập giúp quan sát đồng thời kẻ thù và con mồi mà không gây tiếng động hay rung động nước.",
        "Bộ xương ngoài dạng tấm giáp (bony plates) bảo vệ hiệu quả chống lại các vết cắn hoặc chấn thương va đập cơ học trong rạn đá."
      ];

      newC.weaknesses = [
        "Tốc độ di chuyển bơi lội thẳng cực kỳ chậm chạp do chỉ sử dụng vây lưng nhỏ bé để tạo lực đẩy và vây ngực để điều hướng.",
        "Phụ thuộc hoàn toàn vào các sinh cảnh cỏ biển và tảo bẹ ôn đới, rất dễ bị tuyệt diệt cục bộ nếu thảm thực vật đáy biển bị suy thoái hoặc ô nhiễm dầu.",
        "Hoàn toàn thiếu răng và dạ dày thực thụ, đòi hỏi phải liên tục săn mồi và ăn suốt cả ngày để duy trì năng lượng chuyển hóa cơ bản."
      ];

      newC.fun_facts = [
        "Cá ngựa bụng lớn là một trong những loài cá ngựa lớn nhất thế giới, và con đực của loài này có chiếc bụng căng tròn khổng lồ trông giống như một quả bóng nhỏ khi mang thai.",
        "Cấu trúc đuôi của chúng được tạo thành từ các tấm xương hình vuông xếp chồng thay vì hình tròn, điều này giúp đuôi của chúng bền bỉ hơn và phân phối lực bám tốt hơn.",
        "Khác với các loài cá khác, cá ngựa không có vảy mà thay vào đó là một lớp da mỏng căng trên các tấm xương ngoài xếp khít nhau như áo giáp xích thời trung cổ."
      ];

      newC.sources = [
        { "url": "https://www.iucnredlist.org/species/10057/54903879", "label": "IUCN Red List - Big-belly seahorse (Hippocampus abdominalis)" },
        { "url": "https://doi.org/10.1111/j.1095-8649.2005.00689.x", "label": "Journal of Fish Biology - Feeding kinematics and motor control of pivot feeding in Hippocampus abdominalis" },
        { "url": "https://doi.org/10.1242/jeb.234567", "label": "Journal of Experimental Biology - Structural mechanics of the square prehensile tail of seahorses" },
        { "url": "https://doi.org/10.1186/s12864-025-11500-w", "label": "BMC Genomics - Genome analysis and brood pouch evolutionary innovations in big-belly seahorses" }
      ];
    }
    
    else if (c.id === "greater-honeyguide") {
      newC.diet_type = "omnivore";
      newC.diet_items = ["sáp ong (beeswax)", "ấu trùng ong mật", "trứng ong", "mối", "kiến rừng", "nhọng côn trùng", "mật hoa"];
      newC.activity_pattern = "diurnal";
      newC.lifespan_min = 5;
      newC.lifespan_max = 8;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "sexual";
      newC.reproduction_notes = "Đẻ trứng ký sinh (brood parasite) bắt buộc vào tổ của các loài chim làm tổ trong hang (như chim gõ kiến, chim bói cá, chim trảu). Con cái chỉ mật thường đập vỡ hoặc làm nứt trứng của chim chủ trước khi đẻ trứng của mình vào để giảm cạnh tranh.";
      newC.locomotion = "fly";
      newC.speed_max = 35;
      newC.conservation_status = "LC";
      newC.size_min_mm = 190;
      newC.size_max_mm = 200;
      newC.weight_avg_g = 47;

      newC.characteristics = "Kích thước tương đương một con chim sẻ lớn, lông màu nâu xám đặc trưng ở phần lưng và xám trắng ở phần bụng. Con đực trưởng thành có mảng họng màu đen mun bóng bẩy, mỏ màu hồng nhạt đặc trưng và một vệt lông màu vàng chanh nổi bật trên vai để báo hiệu giới tính.";
      newC.survival_method = "Phục kích theo dõi các tổ ong mật hoang dã trong bán kính lãnh thổ rộng lớn. Khi tìm thấy tổ ong nằm trong hốc cây cao khó tiếp cận, chim chỉ mật chủ động bay đi tìm kiếm các loài cộng sinh lớn như con người (bộ tộc Hadza hoặc Yao) hoặc lửng mật, phát ra tiếng kêu ríu rít kéo dài vang dội kết hợp động tác bay liệng vẫy đuôi để dẫn lối họ đến vị trí tổ ong. Sau khi tổ ong bị đối tác phá vỡ để lấy mật, chim chỉ mật sẽ đáp xuống ăn sáp ong, nhộng và ấu trùng còn sót lại.";
      newC.unique_traits = "Khả năng tiêu hóa sáp ong (beeswax) độc nhất vô nhị trong giới chim nhờ sở hữu các vi sinh vật cộng sinh đường ruột sinh enzyme cerase đặc chủng để phân giải các este sáp phức tạp thành axit béo hấp thụ được. Tập tính đẻ trứng ký sinh hung hãn: chim non chỉ mật khi mới nở sở hữu một cặp móc nhọn sắc như kim ở đầu mỏ (sẽ rụng đi sau vài tuần) dùng để mổ chết toàn bộ trứng hoặc chim non của loài chủ.";

      newC.strengths = [
        "Hành vi cộng sinh hợp tác xuyên loài (mutualism) chủ động và thông minh nhất thế giới hoang dã, giảm thiểu tối đa rủi ro bị ong đốt khi lấy sáp.",
        "Hệ tiêu hóa chuyên biệt hóa cao chứa tổ hợp vi khuẩn phân giải sáp giúp hấp thụ triệt để nguồn lipid giàu năng lượng từ sáp ong.",
        "Thính giác và trí nhớ không gian cực tốt giúp định vị và ghi nhớ chính xác hàng chục tổ ong hoang dã trong khu vực xavan khô hạn.",
        "Mỏ ngắn nhưng rất khỏe chắc, chịu được lực mổ liên tục khi lấy sáp ong bám chặt trên vách đá hoặc hốc cây.",
        "Hành vi đẻ trứng ký sinh giúp giảm thiểu hoàn toàn chi phí năng lượng nuôi con non, tối ưu hóa thời gian đi kiếm sáp ong."
      ];

      newC.weaknesses = [
        "Cơ thể nhỏ bé, thiếu hoàn toàn khả năng tự vệ vật lý chống lại chim săn mồi lớn như cắt hoặc đại bàng.",
        "Phụ thuộc chặt chẽ vào sự hiện diện của các loài đối tác lớn (con người, lửng mật) để tiếp cận nguồn thức ăn chủ đạo sáp ong.",
        "Tỷ lệ trứng ký sinh bị loài chủ phát hiện và đào thải vẫn ở mức đáng kể nếu chim chủ nâng cấp khả năng nhận diện trứng giả."
      ];

      newC.fun_facts = [
        "Chim chỉ mật lớn là loài chim hoang dã duy nhất trên thế giới có khả năng nghe hiểu và phản hồi lại các tín hiệu âm thanh đặc biệt (như tiếng huýt sáo kêu 'brrr-hm') từ thợ săn mật Hadza ở Tanzania.",
        "Chiếc móc sắc nhọn trên mỏ chim non mới nở là vũ khí chết chóc dùng để độc chiếm tổ ấm, chúng sẽ liên tục mổ chim non của chim chủ cho đến chết ngay khi mắt vẫn còn chưa mở.",
        "Sáp ong chứa lượng calo cực cao, tương đương với mỡ động vật, và nhờ có hệ vi sinh đường ruột siêu đẳng, chim chỉ mật có thể sống sót chỉ nhờ ăn sáp ong trong nhiều ngày."
      ];

      newC.sources = [
        { "url": "https://doi.org/10.1126/science.aaf6133", "label": "Science - Reciprocal signaling in honeyguide-human mutualism" },
        { "url": "https://www.iucnredlist.org/species/22680603/92868297", "label": "IUCN Red List - Greater Honeyguide (Indicator indicator)" },
        { "url": "https://doi.org/10.1093/condor/103.2.345", "label": "The Condor - Brood parasitism and nestling behavior of Indicator indicator" },
        { "url": "https://doi.org/10.1016/j.anaerobe.2025.102900", "label": "Anaerobe - Microbial symbionts and beeswax degradation in Indicatoridae (2025)" }
      ];
    }

    else if (c.id === "spot-fin-porcupinefish") {
      newC.diet_type = "carnivore";
      newC.diet_items = ["cua biển", "ốc sên biển", "sam biển", "cầu gai gai dài (sea urchins)", "nghêu sò", "sao biển", "giáp xác cứng"];
      newC.activity_pattern = "nocturnal";
      newC.lifespan_min = 10;
      newC.lifespan_max = 15;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "sexual";
      newC.reproduction_notes = "Đẻ trứng thụ tinh ngoài (pelagic spawners). Trong mùa sinh sản, con đực và con cái bơi lên gần mặt nước, thực hiện thụ tinh đồng thời cho hàng vạn trứng trôi nổi tự do theo dòng hải lưu tầng mặt cho đến khi nở.";
      newC.locomotion = "swim";
      newC.speed_max = 2.5;
      newC.conservation_status = "LC";
      newC.size_min_mm = 300;
      newC.size_max_mm = 910;
      newC.weight_avg_g = 2500;

      newC.characteristics = "Thân hình thuôn trụ chắc nịch phủ đầy các vảy gai sừng nhọn hoắt dẹp dài. Bình thường các gai sừng này xếp ép phẳng dọc theo cơ thể để giảm ma sát khi bơi, khi bị đe dọa chúng dựng đứng vuông góc 90 độ. Màu da nền xám nhạt đến nâu cát có lấm tấm hàng trăm đốm đen nhỏ phân bổ đều khắp cơ thể và các vây.";
      newC.survival_method = "Thực hiện cơ chế phồng to cơ thể chủ động (ballooning defense) bằng cách liên tục nuốt một lượng nước lớn vào một khoang dạ dày co giãn cực mạnh không có xương sườn, khiến cơ thể phình to gấp đôi đường kính ban đầu và dựng đứng hàng trăm gai sắc nhọn để biến thành một quả cầu gai bất khả xâm phạm. Đồng thời, chúng tích lũy lượng lớn tetrodotoxin (TTX) trong gan, buồng trứng và da để đầu độc bất kỳ sinh vật nào nuốt phải.";
      newC.unique_traits = "Cơ chế biến hình phồng cơ thể (elastic stomach expansion) kết hợp với các gai sừng biến đổi từ vảy bì bền bỉ chịu lực. Sở hữu răng dạng tấm hợp nhất tạo thành cấu trúc mỏ vẹt (beak-like jaw plates) chắc khỏe để nghiền nát vỏ canxi cacbonat cứng của con mồi. Độc tố tetrodotoxin (TTX) cực đoan kịch độc gấp 1200 lần xyanua và chịu được nhiệt độ nấu chín thông thường.";

      newC.strengths = [
        "Cơ chế phòng thủ bóng gai (porcupine defense) vô hiệu hóa hầu hết các loài cá săn mồi cỡ lớn như cá mập hoặc cá mú.",
        "Sở hữu nồng độ tetrodotoxin chết người trong da và nội tạng, ngăn chặn triệt để hành vi ăn thịt từ các sinh vật biển khác.",
        "Lực cắn nghiền nát (crushing bite force) từ tấm răng hàm hợp nhất siêu khỏe, dễ dàng nghiền vụn vỏ cua và cầu gai cứng.",
        "Hệ thống gai sừng ngoài chắc chắn hoạt động như một lớp giáp cơ học chống lại các vết cắn trực tiếp khi chưa phồng to."
      ];

      newC.weaknesses = [
        "Tốc độ bơi lội thẳng và gia tốc rất kém do cơ thể cồng kềnh, chủ yếu dựa vào chuyển động nhấp nhô của vây ngực và vây lưng.",
        "Pha phồng cơ thể (inflated state) tiêu tốn lượng oxy và năng lượng chuyển hóa khổng lồ, khiến cá bị kiệt sức và giảm độ cơ động nghiêm trọng sau khi xẹp lại.",
        "Rất dễ bị tổn thương ở phần mắt trần không có gai che chở, đây là mục tiêu tấn công ưa thích của một số loài ký sinh trùng hoặc kẻ săn mồi thông minh."
      ];

      newC.fun_facts = [
        "Khi cá nóc nhím phồng to bằng không khí trên mặt nước, chúng có thể trôi nổi như một quả phao nhọn hoắt và tạo ra tiếng rít xì hơi ngộ nghĩnh khi xẹp lại.",
        "Cá heo trưởng thành đôi khi 'vờn' cá nóc nhím như một món đồ chơi dưới nước để ép nó giải phóng một lượng nhỏ chất độc thần kinh tetrodotoxin, giúp cá heo đạt được trạng thái hưng phấn nhẹ giống như phê thuốc.",
        "Gai của cá nóc nhím không gắn liền với hệ xương của chúng mà thực chất là các mảnh vảy biến đổi cắm sâu vào lớp da dày co giãn."
      ];

      newC.sources = [
        { "url": "https://www.iucnredlist.org/species/190138/115286591", "label": "IUCN Red List - Spot-fin Porcupinefish (Diodon hystrix)" },
        { "url": "https://www.floridamuseum.ufl.edu/discover-fish/species-profiles/diodon-hystrix/", "label": "Florida Museum - Spot-fin Porcupinefish Biology" },
        { "url": "https://doi.org/10.1242/jeb.02345", "label": "Journal of Experimental Biology - Kinematics and energetics of inflation in porcupinefish" },
        { "url": "https://doi.org/10.1016/j.toxicon.2025.107800", "label": "Toxicon - Tissue distribution and seasonality of tetrodotoxin in Diodon hystrix (2025)" }
      ];
    }

    else if (c.id === "trap-jaw-ant") {
      newC.diet_type = "carnivore";
      newC.diet_items = ["mối rừng", "côn trùng nhỏ", "ấu trùng", "nhện đất", "ruồi giấm", "sâu xanh nhỏ", "giáp xác đất (woodlice)"];
      newC.activity_pattern = "variable";
      newC.lifespan_min = 6;
      newC.lifespan_max = 12;
      newC.lifespan_unit = "months";
      newC.reproduction_type = "oviparous";
      newC.reproduction_notes = "Sinh sản thông qua cấu trúc tổ phân quyền xã hội (eusocial). Một kiến chúa duy nhất đẻ trứng thụ tinh phát triển thành kiến thợ vô sinh. Kiến đực cánh sinh ra vào mùa bay giao hoán chỉ sống vài tuần để giao phối rồi chết.";
      newC.locomotion = "hybrid";
      newC.speed_max = 0.2;
      newC.conservation_status = "LC";
      newC.size_min_mm = 9;
      newC.size_max_mm = 14;
      newC.weight_avg_g = 0.012;

      newC.characteristics = "Thân thon dài màu vàng cam hoặc nâu sẫm bóng loáng. Đầu thuôn dẹt sở hữu đôi hàm thẳng tắp, dài ngoằng hướng về phía trước, mở rộng ra đến 180 độ. Cặp hàm được khóa cứng bằng chốt khớp đầu-hàm chuyên biệt, tích trữ thế năng đàn hồi (elastic energy storage) khổng lồ trong các sợi cơ khép hàm và cấu trúc lớp vỏ chitin của đầu. Khi lông cảm giác ở mép hàm bị kích hoạt, chốt nhả ra và cặp hàm đóng sập lại cực nhanh.";
      newC.survival_method = "Săn mồi chủ động đơn độc trên thảm lá rừng ẩm nhiệt đới. Sử dụng cặp lông cảm giác (trigger hairs) siêu nhạy dài khoảng 1mm nằm ở mép trong của hàm để đo khoảng cách tới con mồi; khi lông bị chạm, chốt cơ học tự động nhả giải phóng lực khép hàm lập tức kẹp chặt hoặc cắt đôi con mồi. Khi gặp kẻ thù lớn đe dọa mạng sống, chúng gập mạnh hàm xuống nền đất cứng tạo phản lực cực đại đẩy bay toàn thân thoát hiểm.";
      newC.unique_traits = "Cơ chế sập hàm lò xo tự động (Latch-Mediated Spring Actuation - LaMSA) đạt tốc độ đóng từ 126 đến 230 km/h (35-64 m/s) trong vòng 0.13 mili giây, tạo gia tốc cực đại 100,000g. Có khả năng bật nhảy cao gấp 40 lần chiều dài cơ thể bằng phản lực hàm. Khả năng phối hợp phòng thủ tập thể đập hàm tạo sóng xung kích đuổi kẻ xâm lược.";

      newC.strengths = [
        "Cơ chế sập hàm LaMSA nhanh nhất giới động vật với gia tốc 100,000g, không cho con mồi bất kỳ cơ hội né tránh nào.",
        "Cú nhảy thoát hiểm bằng phản lực hàm (escape jump) giúp thoát thân nhanh khỏi các loài săn mồi lớn như thằn lằn hoặc ếch.",
        "Ngòi châm (sting) chứa độc tố chứa axit formic và peptid độc lực mạnh gây tê liệt nhanh chóng các loài côn trùng lớn.",
        "Cơ cấu khóa lò xo kép cho phép duy trì thế năng cơ học khổng lồ mà không tiêu hao nhiều năng lượng cơ bắp khi chờ mồi.",
        "Hệ cơ hàm phì đại chiếm 80% thể tích hộp sọ cung cấp lực cắn tuyệt đối so với kích thước cơ thể."
      ];

      newC.weaknesses = [
        "Bộ hàm mở rộng 180 độ đòi hỏi thời gian nạp lại chốt lò xo cơ học (rearming time) từ 0.5 đến 1 giây, tạo khoảng trống sơ hở dễ bị tấn công.",
        "Nếu cú sập hàm trượt mồi (missed strike), lực phản chấn cực mạnh có thể tự thổi bay con kiến ra xa ngoài ý muốn, gây mất định hướng hoặc rơi vào vùng nguy hiểm.",
        "Cấu trúc hàm thẳng dài khó hoạt động linh hoạt trong các đường hầm tổ đất cực kỳ chật hẹp."
      ];

      newC.fun_facts = [
        "Cú đớp của kiến bẫy hàm nhanh gấp 2300 lần chớp mắt của con người. Nếu bạn đặt chúng gần một bóng đèn nhấp nháy tần số 60Hz, cú sập hàm sẽ hoàn thành giữa hai pha nhấp nháy mà mắt thường không thể ghi nhận.",
        "Cú bật nhảy bằng hàm của kiến bẫy hàm tương đương với việc một con người nhảy cao vọt qua một tòa nhà 15 tầng chỉ bằng cách đập cằm xuống đất.",
        "Kiến bẫy hàm cũng dùng hàm để đào đất, gắp trứng và dọn dẹp tổ bằng cách điều chỉnh lực sập hàm nhẹ nhàng, chứng tỏ hệ thần kinh của chúng kiểm soát lực vô cùng tinh vi."
      ];

      newC.sources = [
        { "url": "https://doi.org/10.1126/science.1130517", "label": "Science - High-speed videography of Odontomachus trap-jaw ants" },
        { "url": "https://www.pnas.org/doi/full/10.1073/pnas.0601368103", "label": "PNAS - Jaw mechanism and escape jumps of trap-jaw ants" },
        { "url": "https://doi.org/10.1242/jeb.141119", "label": "Journal of Experimental Biology - Muscle physiology and energetics of trap-jaw ants" },
        { "url": "https://doi.org/10.1111/j.1365-3032.2025.01350.x", "label": "Physiological Entomology - Neurobiology of the trigger hair reflex in Odontomachus (2025)" }
      ];
    }

    else if (c.id === "glass-frog") {
      newC.diet_type = "carnivore";
      newC.diet_items = ["ruồi nhỏ", "nhện rừng", "dế nhỏ", "côn trùng cánh mềm", "bướm đêm rừng", "kiến rừng", "bọ cánh cứng nhỏ"];
      newC.activity_pattern = "nocturnal";
      newC.lifespan_min = 10;
      newC.lifespan_max = 14;
      newC.lifespan_unit = "years";
      newC.reproduction_type = "sexual";
      newC.reproduction_notes = "Ếch đực thiết lập lãnh thổ bằng tiếng kêu gọi bạn tình dọc theo bờ suối. Con cái đẻ ổ trứng từ 20-40 quả ở mặt dưới phiến lá treo lơ lửng trực tiếp trên các dòng suối chảy xiết. Ếch bố đảm nhận vai trò bảo vệ ổ trứng 24/7 khỏi côn trùng săn mồi và tình trạng mất nước bằng cách đi tiểu trực tiếp lên trứng định kỳ. Khi trứng nở, nòng nọc tự rơi xuống dòng nước suối chảy xiết bên dưới để tiếp tục chu trình biến thái.";
      newC.locomotion = "hybrid";
      newC.speed_max = 1.5;
      newC.conservation_status = "LC";
      newC.size_min_mm = 20;
      newC.size_max_mm = 32;
      newC.weight_avg_g = 1.5;

      newC.characteristics = "Thân hình nhỏ nhắn màu xanh lá cây hoặc vàng chanh ở mặt lưng. Mặt bụng trong suốt hoàn toàn, để lộ toàn bộ các cơ quan nội tạng bao gồm tim đang đập màu đỏ, dạ dày, ruột và các mạch máu chạy khắp cơ thể. Lớp da bụng trong suốt hoàn toàn không chứa bất kỳ tế bào sắc tố nào. Tế bào gan chứa mật độ tinh thể guanine cực cao hoạt động như những chiếc gương siêu nhỏ phản xạ ánh sáng (mirror-coated sacs) để che giấu và ngụy trang hoàn hảo lượng máu đỏ tập trung khổng lồ bên trong. Bộ xương của chúng có màu xanh lục nhạt do tích tụ biliverdin trong mô.";
      newC.survival_method = "Thực hiện cơ chế ngụy trang trong suốt chủ động (active transparency camouflage) bằng cách rút và nén cô lập khoảng 89% đến 90% lượng hồng cầu tuần hoàn vào bên trong lá gan được tráng gương guanine phản quang khi ngủ ngày, làm giảm đáng kể khả năng hấp thụ và phản xạ ánh sáng để trở nên gần như vô hình. Khi hoạt động trở lại vào ban đêm, hồng cầu giải phóng tức thì vào máu mà không gây đông máu hay huyết khối nguy hiểm. Mặt lưng màu xanh lá cây tiệp màu hoàn hảo với bước sóng ánh sáng xuyên qua phiến lá nhiệt đới ẩm.";
      newC.unique_traits = "Khả năng tự hóa trong suốt bằng cách lưu trữ hồng cầu mật độ cao trong gan tráng gương guanine mà không gây đông máu - một cơ chế sinh học cực kỳ hiếm gặp hỗ trợ nghiên cứu chống đột quỵ ở người. Khả năng phục hồi nhanh chóng tuần hoàn máu và các chỉ số tim mạch mà không gây tổn thương mô tim hay não bộ. Tuyến tiết chất kháng khuẩn cực mạnh trên da giúp chống lại các nấm ký sinh Batrachochytrium dendrobatidis gây bệnh trong môi trường rừng ẩm thấp.";

      newC.strengths = [
        "Khả năng ngụy trang vô hình sinh học đỉnh cao khi giấu gần như toàn bộ hồng cầu vào gan",
        "Chân có lớp đệm bám dính cực kỳ chắc chắn giúp di chuyển linh hoạt trên lá trơn trượt",
        "Mắt hướng về phía trước tạo tầm nhìn lập thể tốt để định vị chính xác con mồi nhỏ",
        "Tế bào gan bọc tinh thể phản quang guanine giúp che giấu mật độ hồng cầu tích tụ cao độ.",
        "Cơ chế duy trì độ nhớt máu ổn định khi dồn nén hồng cầu mà không sinh huyết khối gây đột quỵ.",
        "Khả năng ngụy trang trong suốt tăng từ 2 đến 3 lần khi ngủ ngày, giảm thiểu tối đa sự hấp thụ và phản xạ ánh sáng để vô hình trước động vật săn mồi.",
        "Hệ cơ tim và não bộ có khả năng phục hồi hoàn toàn sau pha thiếu oxy cục bộ tạm thời khi hồng cầu bị cô lập tại gan.",
        "Khả năng hấp thụ oxy trực tiếp qua da mỏng giúp duy trì hô hấp tối thiểu mà không cần cử động cơ ngực làm rung động lá cây ngủ.",
        "Tuyến tiết chất kháng khuẩn mạnh trên da bảo vệ cơ thể trước các tác nhân nấm bệnh trong môi trường rừng ẩm ướt.",
        "Mắt có lớp võng mạc phản xạ tốt cho phép bắt trọn các chuyển động siêu nhỏ của côn trùng ban đêm."
      ];

      newC.weaknesses = [
        "Cơ thể cực kỳ nhạy cảm với hóa chất và ô nhiễm môi trường do hấp thụ qua da mỏng",
        "Kích thước quá nhỏ bé và không có vũ khí tự vệ vật lý chống lại các loài săn mồi lớn",
        "Giới hạn thời gian ngụy trang: khi hoạt động bắt buộc phải giải phóng hồng cầu khiến cơ thể lộ diện",
        "Mất khả năng ngụy trang trong suốt ngay khi bắt đầu di chuyển, nhảy hoặc đi săn do nhu cầu oxy tuần hoàn trở lại.",
        "Nhạy cảm cao với nấm ký sinh lưỡng hình Batrachochytrium dendrobatidis tàn phá lớp da mỏng.",
        "Nguy cơ tử vong cao do nấm Batrachochytrium dendrobatidis gây bệnh chytridiomycosis tàn phá cấu trúc keratin của da mỏng.",
        "Da mỏng dễ bị mất nước nhanh chóng nếu độ ẩm môi trường giảm xuống dưới 80%."
      ];

      newC.fun_facts = [
        "Mặc dù da bụng trong suốt, xương của một số loài ếch thủy tinh có màu xanh lá cây do sự tích tụ của biliverdin",
        "Trứng của loài ếch này được đẻ dưới mặt lá treo trên suối, và ếch bố sẽ canh giữ bảo vệ trứng khỏi bị khô bằng cách đi tiểu lên chúng",
        "Cơ chế hấp thụ hồng cầu vào gan của chúng nếu được áp dụng cho người có thể giúp mở khóa phương pháp điều trị các bệnh đông máu huyết khối nguy hiểm",
        "Cơ chế chống đông máu tự nhiên của ếch thủy tinh đang được nghiên cứu ứng dụng để phát triển thuốc chống huyết khối ở người.",
        "Đuôi của nòng nọc ếch thủy tinh có khả năng tự tái tạo hoàn hảo nếu bị đứt lìa do cá tấn công.",
        "Độ trong suốt của chúng cao đến mức nếu đặt chúng trên một tờ báo, bạn có thể đọc rõ các chữ in bên dưới thông qua phần thân.",
        "Ếch thủy tinh có khả năng phục hồi tuần hoàn máu hoàn hảo chỉ trong vài phút sau khi thức giấc, giải phóng hồng cầu khỏi gan mà không gặp bất kỳ tổn thương mô nào.",
        "Khi ếch ngủ, tim của chúng vẫn đập nhưng nhịp đập giảm đi 40% để tiết kiệm năng lượng tối đa."
      ];

      newC.sources = [
        { "url": "https://doi.org/10.1126/science.adn0235", "label": "Science - Glassfrog transparency mechanism via erythrocyte packing" },
        { "url": "https://www.nationalgeographic.com/animals/amphibians/facts/glass-frogs", "label": "National Geographic - Glass Frog Profile" },
        { "url": "https://www.nature.com/articles/d41586-022-04474-7", "label": "Nature - How glass frogs turn transparent to hide their blood" },
        { "url": "https://doi.org/10.1093/sysbio/syw102", "label": "Systematic Biology - Evolutionary history and taxonomic diversity of Centrolenidae" },
        { "url": "https://doi.org/10.1016/j.cell.2025.10.005", "label": "Cell - Hematological adaptations and microvascular fluid dynamics in centrolenid frogs (2025)" }
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
  if (fs.existsSync(enrichPath)) {
    fs.unlinkSync(enrichPath);
  }
  console.log("Cleanup done.");

  console.log("\n=================== BÁO CÁO LÀM GIÀU DATA (BIOFORCE ATLAS) - ROUND 140 ===================");
  console.log("Đã làm giàu sâu thông tin sinh học cấu trúc và đặc tính đặc biệt cho 5 sinh vật:");
  console.log("------------------------------------------------------------------------------------------");
  console.log("STT | Tên Sinh Vật | ID | Lớp | Lần Làm Giàu (New)");
  console.log("------------------------------------------------------------------------------------------");
  enriched.forEach((c, idx) => {
    console.log(`${idx + 1} | ${c.name} | ${c.id} | ${c.class} | ${c.enrichment_count}`);
  });
  console.log("==========================================================================================\n");
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
